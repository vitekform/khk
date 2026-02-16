import { fillDocxTemplate } from './docxHelper.js';
import { convertDocxToPDF } from './pdfConverter.js';

// Function to create a PDF from DOCX template
async function createFormPDFFromTemplate(data, request) {
    // Fetch the template file
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    const templateResponse = await fetch(`${baseUrl}/prihlaska_template.docx`);
    if (!templateResponse.ok) {
        throw new Error(`Failed to load template: ${templateResponse.status} ${templateResponse.statusText}`);
    }
    
    const templateBuffer = await templateResponse.arrayBuffer();
    
    // Fill the template with form data
    const filledDocxBuffer = await fillDocxTemplate(templateBuffer, data);
    
    // Convert form data to PDF using pdf-lib  
    const pdfBytes = await convertDocxToPDF(data, request);
    
    return { pdfBytes, docxBytes: filledDocxBuffer };
}

export async function onRequest(context) {
    const { request, env } = context;

    try {
        const requestData = await request.json();

        let toEmail = 'vitekform@gmail.com';
        let ccEmail = requestData['Email zástupce pro komunikaci'] || requestData['Email'];

        // Create PDF and filled DOCX with form data using template
        const { pdfBytes, docxBytes } = await createFormPDFFromTemplate(requestData, request);

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

        // Attach both PDF and filled DOCX
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        formData.append('attachment', pdfBlob, 'prihlaska-KHK.pdf');
        
        const docxBlob = new Blob([docxBytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        formData.append('attachment', docxBlob, 'prihlaska-KHK.docx');

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
