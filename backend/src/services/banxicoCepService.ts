import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ExtractedPaymentData } from './geminiVisionPaymentService';

// Aplicar plugin stealth para evitar detección como bot
puppeteerExtra.use(StealthPlugin());

export interface BanxicoCepResult {
    verified: boolean;
    found: boolean;
    claveRastreo?: string;
    monto?: number;
    fecha?: string;
    emisor?: string;
    receptor?: string;
    estadoOperacion?: string;
    error?: string;
}

// Mapa de nombres de banco a claves de banco en el formulario de Banxico
const BANK_CODES: Record<string, string> = {
    'bbva': '40012',
    'bancomer': '40012',
    'santander': '14553',
    'banamex': '40002',
    'citibanamex': '40002',
    'hsbc': '40021',
    'banorte': '40072',
    'inbursa': '40036',
    'scotiabank': '44044',
    'banco azteca': '40127',
    'azteca': '40127',
    'banregio': '58465',
    'bajio': '40030',
    'afirme': '40062',
    'banbajio': '40030',
    'bienestar': '40166',
    'cibanco': '40143',
    'intercam': '91240',
    'nu': '90659',
    'hey banco': '90548',
    'spin by oxxo': '90706',
    'mercado pago': '90722',
    'clip': '90728',
};

function getBankCode(bankName: string): string | null {
    if (!bankName) return null;
    const normalized = bankName.toLowerCase().trim();
    for (const [key, code] of Object.entries(BANK_CODES)) {
        if (normalized.includes(key)) return code;
    }
    return null;
}

export async function verifyWithBanxico(
    paymentData: ExtractedPaymentData
): Promise<BanxicoCepResult> {
    if (!paymentData.claveRastreo) {
        return { verified: false, found: false, error: 'no_tracking_key' };
    }

    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

    let browser: any = null;
    try {
        browser = await puppeteerExtra.launch({
            headless: true,
            executablePath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-extensions',
                '--disable-web-security',
            ],
        });

        const page = await browser.newPage();

        // Emular un navegador real
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        console.log('🌐 Navegando a Banxico CEP...');
        await page.goto('https://www.banxico.org.mx/cep/', {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });

        // Esperar a que cargue el formulario
        await page.waitForSelector('form', { timeout: 15000 }).catch(() => {
            console.warn('⚠️  No se encontró form en Banxico CEP');
        });

        // Screenshot debug (solo en desarrollo)
        // await page.screenshot({ path: '/tmp/banxico-debug.png' });

        // Llenar la clave de rastreo
        const claveInput = await page.$('input[name="claveRastreo"], input[id="claveRastreo"], input[type="text"]:first-of-type');
        if (claveInput) {
            await claveInput.click({ clickCount: 3 });
            await claveInput.type(paymentData.claveRastreo, { delay: 50 });
            console.log('✅ Clave de rastreo ingresada:', paymentData.claveRastreo);
        } else {
            console.warn('⚠️  No se encontró el campo de clave de rastreo');
        }

        // Llenar fecha si está disponible
        if (paymentData.fecha) {
            const fechaInput = await page.$('input[name="fecha"], input[id="fecha"], input[type="date"]');
            if (fechaInput) {
                await fechaInput.click({ clickCount: 3 });
                await fechaInput.type(paymentData.fecha, { delay: 30 });
            }
        }

        // Llenar monto si está disponible
        if (paymentData.monto) {
            const montoInput = await page.$('input[name="monto"], input[id="monto"]');
            if (montoInput) {
                await montoInput.click({ clickCount: 3 });
                await montoInput.type(String(paymentData.monto), { delay: 30 });
            }
        }

        // Seleccionar banco emisor
        if (paymentData.bancoEmisor) {
            const bankCode = getBankCode(paymentData.bancoEmisor);
            if (bankCode) {
                const selectEl = await page.$('select[name="banco"], select[id="banco"], select');
                if (selectEl) {
                    await page.select('select', bankCode);
                }
            }
        }

        // Enviar el formulario
        const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
        if (submitBtn) {
            await submitBtn.click();
        } else {
            // Intentar submit del formulario directamente usando any
            await page.$eval('form', (form: any) => form.submit());
        }

        // Esperar resultado
        await page.waitForTimeout(5000);

        // Leer el resultado de la página
        const pageContent = await page.content();
        const pageText = await page.$eval('body', (el: any) => el.innerText);

        console.log('📄 Resultado Banxico (primeros 500 chars):', pageText.slice(0, 500));

        // Detectar si el CEP fue encontrado
        const found = pageContent.includes('Comprobante Electrónico de Pago') &&
            (pageContent.includes('Aceptada') || pageContent.includes('Liquidada') ||
                pageContent.includes('monto') || pageContent.includes('claveRastreo'));

        const notFound = pageText.includes('no encontrada') ||
            pageText.includes('No se encontró') ||
            pageText.includes('no fue encontrada') ||
            pageText.includes('error');

        if (found && !notFound) {
            console.log('✅ Banxico: Pago VERIFICADO');
            return {
                verified: true,
                found: true,
                claveRastreo: paymentData.claveRastreo,
                monto: paymentData.monto ?? undefined,
                fecha: paymentData.fecha ?? undefined,
                estadoOperacion: 'Aceptada',
            };
        } else {
            console.log('❌ Banxico: Pago NO encontrado o no verificado');
            return {
                verified: false,
                found: false,
                error: 'banxico_not_found',
                claveRastreo: paymentData.claveRastreo,
            };
        }

    } catch (error: any) {
        console.error('❌ Error en Banxico CEP service:', error.message);
        return {
            verified: false,
            found: false,
            error: `puppeteer_error: ${error.message}`,
        };
    } finally {
        if (browser) {
            await browser.close().catch((e: any) => console.warn('Error cerrando browser:', e.message));
        }
    }
}
