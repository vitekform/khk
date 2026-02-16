import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// Function to create a PDF document with form data
async function createFormPDF(data, request) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    
    // Fetch DejaVu fonts from public assets
    // Construct the base URL from the request
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    const fontRegularResponse = await fetch(`${baseUrl}/fonts/DejaVuSans.ttf`);
    const fontBoldResponse = await fetch(`${baseUrl}/fonts/DejaVuSans-Bold.ttf`);
    
    if (!fontRegularResponse.ok || !fontBoldResponse.ok) {
        throw new Error('Failed to load font files');
    }
    
    const fontBytes = await fontRegularResponse.arrayBuffer();
    const fontBoldBytes = await fontBoldResponse.arrayBuffer();
    const font = await pdfDoc.embedFont(fontBytes);
    const fontBold = await pdfDoc.embedFont(fontBoldBytes);
    
    let page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    const fontSize = 10;
    const boldFontSize = 11;
    const lineHeight = 14;
    let yPosition = height - 50;
    
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
    
    // Helper function to add a field with label and value
    const addField = (label, value) => {
        if (yPosition < 50) {
            page = pdfDoc.addPage([595, 842]);
            yPosition = height - 50;
        }
        
        addText(label + ':', 50, yPosition, fontBold, boldFontSize);
        yPosition -= lineHeight;
        
        const valueStr = value ? String(value) : '';
        const maxWidth = width - 100;
        const words = valueStr.split(' ');
        let line = '';
        
        for (const word of words) {
            const testLine = line + (line ? ' ' : '') + word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);
            
            if (testWidth > maxWidth && line) {
                addText(line, 70, yPosition);
                yPosition -= lineHeight;
                line = word;
            } else {
                line = testLine;
            }
        }
        
        if (line) {
            addText(line, 70, yPosition);
            yPosition -= lineHeight;
        }
        
        yPosition -= 5; // Extra spacing between fields
    };
    
    // Title
    addText('PŘIHLÁŠKA DO HOSPODÁŘSKÉ KOMORY ČESKÉ REPUBLIKY', 50, yPosition, fontBold, 14);
    yPosition -= 25;
    
    // Add all fields
    Object.entries(data).forEach(([key, value]) => {
        addField(key, value);
    });
    
    return await pdfDoc.save();
}

export async function onRequest(context) {
    const { request, env } = context;

    try {
        const requestData = await request.json();

        let toEmail = 'vitekform@gmail.com';
        let ccEmail = requestData['Email zástupce pro komunikaci'] || requestData['Email'];

        // Create PDF with form data
        const pdfBytes = await createFormPDF(requestData, request);

        if (!env.MAILGUN_API_KEY || !env.MAILGUN_DOMAIN) {
            throw new Error("MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables must be configured");
        }

        const formData = new FormData();
        formData.append('from', `KHK Form System <noreply@${env.MAILGUN_DOMAIN}>`);
        formData.append('to', toEmail);
        if (ccEmail) {
            formData.append('cc', ccEmail);
        }
        formData.append('subject', 'Přihláška do KHK Pardubice');
        formData.append('text', 'Dobrý den, zde zasíláme vámi vyžádanou přihlášku do KHK Pardubice.');

        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        formData.append('attachment', pdfBlob, 'prihlaska-KHK.pdf');

        const mailgunUrl = `https://api.eu.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;
        const emailResponse = await fetch(mailgunUrl, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`
            },
            body: formData
        });

        if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error("Email sending failed:", errorText);
            throw new Error(`Failed to send email: ${emailResponse.status} ${errorText}`);
        }

        return new Response(
            JSON.stringify({ success: true, message: "Form submitted successfully" }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error) {
        console.error("Error in submitForm:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { "Content-Type": "application/json" }, status: 500 }
        );
    }
}
