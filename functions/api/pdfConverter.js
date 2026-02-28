import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

/**
 * Convert form data to PDF using pdf-lib
 * This creates a formatted PDF from the form data
 * @param {Object} data - Form data to include in the PDF
 * @param {Request} request - Request object to fetch fonts
 * @returns {Uint8Array} - The PDF as byte array
 */
export async function convertDocxToPDF(data, request) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    
    // Fetch DejaVu fonts and logo from public assets
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    const [fontRegularResponse, fontBoldResponse, logoResponse] = await Promise.all([
        fetch(`${baseUrl}/fonts/DejaVuSans.ttf`),
        fetch(`${baseUrl}/fonts/DejaVuSans-Bold.ttf`),
        fetch(`${baseUrl}/khk_logo.png`)
    ]);
    
    if (!fontRegularResponse.ok || !fontBoldResponse.ok) {
        throw new Error('Failed to load fonts');
    }
    
    const fontBytes = await fontRegularResponse.arrayBuffer();
    const fontBoldBytes = await fontBoldResponse.arrayBuffer();
    const font = await pdfDoc.embedFont(fontBytes);
    const fontBold = await pdfDoc.embedFont(fontBoldBytes);
    
    let logoImage = null;
    if (logoResponse.ok) {
        const logoBytes = await logoResponse.arrayBuffer();
        logoImage = await pdfDoc.embedPng(logoBytes);
    }
    
    let page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    const fontSize = 9;
    const labelFontSize = 9;
    const sectionFontSize = 11;
    const titleFontSize = 14;
    const lineHeight = 12;
    let yPosition = height - 50;
    
    // Helper function to format date to Czech format (D. M. YYYY)
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
    };

    // Helper function to add a new page
    const addNewPage = () => {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
    };

    // Helper function to add text
    const addText = (text, x, y, currentFont = font, size = fontSize) => {
        page.drawText(text, {
            x,
            y,
            size,
            font: currentFont,
            color: rgb(0, 0, 0),
        });
    };

    // Draw Logo centered
    if (logoImage) {
        const logoDims = logoImage.scale(0.35);
        page.drawImage(logoImage, {
            x: (width - logoDims.width) / 2,
            y: height - logoDims.height - 30,
            width: logoDims.width,
            height: logoDims.height,
        });
    }

    yPosition = height - 100;

    // Title
    addText('PŘIHLÁŠKA ZA ČLENA KRAJSKÉ HOSPODÁŘSKÉ KOMORY', 50, yPosition, fontBold, titleFontSize);
    yPosition -= 18;
    addText('PARDUBICKÉHO KRAJE', 50, yPosition, fontBold, titleFontSize);
    yPosition -= 40;
    
    // Grid settings
    const col1X = 50;
    const col2X = 180;
    const col3X = 310;
    const col4X = 440;
    const colWidth = 120;
    
    let currentColumn = 0; // 0 or 1 (for logical columns, each having label and value)

    const addWideField = (label, value) => {
        endRow();
        const valueStr = value ? String(value) : '';
        const words = valueStr.split(' ');
        let lines = [];
        let currentLine = '';
        const maxWidth = width - col2X - 50;

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);
            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);

        if (yPosition - (lines.length * lineHeight) < 40) addNewPage();

        addText(label + ':', col1X, yPosition, fontBold, labelFontSize);
        for (const line of lines) {
            addText(line, col2X, yPosition, font, fontSize);
            yPosition -= lineHeight;
        }
        yPosition -= 8;
    };

    const addSection = (title) => {
        if (yPosition < 60) addNewPage();
        yPosition -= 10;
        addText(title, 50, yPosition, fontBold, sectionFontSize);
        yPosition -= 18;
        currentColumn = 0;
    };

    let currentRowMaxLines = 1;

    const addField = (label, value) => {
        const xLabel = currentColumn === 0 ? col1X : col3X;
        const xValue = currentColumn === 0 ? col2X : col4X;
        const maxWidth = colWidth;

        const valueStr = value ? String(value) : '';
        
        // Handle multi-line value
        const words = valueStr.split(' ');
        let lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);
            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        if (lines.length === 0) lines = [''];

        const fieldHeight = lines.length * lineHeight;

        if (yPosition - fieldHeight < 40) {
            addNewPage();
        }

        addText(label + ':', xLabel, yPosition, fontBold, labelFontSize);
        
        let localY = yPosition;
        for (const line of lines) {
            addText(line, xValue, localY, font, fontSize);
            localY -= lineHeight;
        }

        currentRowMaxLines = Math.max(currentRowMaxLines, lines.length);

        if (currentColumn === 0) {
            currentColumn = 1;
        } else {
            currentColumn = 0;
            yPosition -= (currentRowMaxLines * lineHeight) + 8;
            currentRowMaxLines = 1;
        }
    };

    const endRow = () => {
        if (currentColumn === 1) {
            currentColumn = 0;
            yPosition -= (currentRowMaxLines * lineHeight) + 8;
            currentRowMaxLines = 1;
        }
    };
    
    // Section I: Identifikační a kontaktní údaje
    addSection('I. IDENTIFIKAČNÍ A KONTAKTNÍ ÚDAJE');
    
    addWideField('Název firmy', data['Název Firmy']);
    addField('IČ', data['IČ']);
    addField('DIČ', data['DIČ']);
    addField('Ulice, číslo', data['Ulice a Číslo']);
    addField('Kraj', data['Kraj']);
    addField('Město', data['Město']);
    addField('PSČ', data['PSČ']);
    addField('Telefon', data['Telefon']);
    addField('E-mail', data['Email']);
    addField('Statutární zástupce', data['Statutární zástupce']);
    addField('E-mail stat. zást.', data['Email statutárního zástupce']);
    addField('Funkce stat. zást.', data['Funkce statutárního zástupce']);
    addField('Tel. stat. zást.', data['Telefon statutárního zástupce']);
    addField('Právní forma', data['Právní Forma']);
    addField('WWW stránky', data['WWW Stránky']);
    addField('Datum zápisu', formatDate(data['Datum založení']));
    addField('Spisová značka', data['Spisová značka']);
    addField('ID dat. schránky', data['ID datové schránky']);
    endRow();

    addSection('KONTAKTNÍ OSOBA PRO KHK PK');
    addField('Jméno', data['Zástupce pro komunikaci s KHK PK']);
    addField('Telefon', data['Telefon zástupce pro komunikaci']);
    addField('Funkce', data['Funkce zástupce pro komunikaci']);
    addField('E-mail', data['Email zástupce pro komunikaci']);
    endRow();
    
    // Section II: Ekonomické údaje
    addSection('II. EKONOMICKÉ ÚDAJE');
    
    addField('Počet zaměstnanců', data['Množství zaměstanců']);
    addField('Čistý obrat (Kč)', data['Čistý obrat (Kč)']);
    endRow();
    
    // Section III: Popis činnosti firmy
    addSection('III. POPIS ČINNOSTI FIRMY');
    
    addWideField('CZ-NACE', data['Převažující obor činnosti dle CZ-NACE']);
    addWideField('Specifikace produktů a služeb', data['Specifikace produktů a služeb']);
    addWideField('Země exportu / Zájem o export', data['Země, kam exportujete/chcete exportovat'] || 'Žádné');
    
    // Additional information
    addSection('DOPLŇUJÍCÍ INFORMACE');
    currentColumn = 0;
    
    addField('E-mail faktury', data['Email pro faktury']);
    addField('E-mail newsletter', data['Email pro newsletter']);
    addField('Zájem o monitor', data['Zájem o zasílání monitoru']);
    addField('Datum podání', formatDate(data['Datum podání']));
    endRow();
    
    return await pdfDoc.save();
}
