import { fillDocxTemplate } from './docxHelper.js';
import CloudConvert from 'cloudconvert';

// Function to create a PDF from DOCX template
async function createFormPDFFromTemplate(data, request, env) {
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
    
    // Convert DOCX to PDF using CloudConvert
    if (!env.CLOUDCONVERT_API_KEY) {
        throw new Error("CLOUDCONVERT_API_KEY environment variable must be configured");
    }
    
    const cloudConvert = new CloudConvert(env.CLOUDCONVERT_API_KEY);
    
    try {
        // Create a job to convert DOCX to PDF
        const job = await cloudConvert.jobs.create({
            tasks: {
                'import-docx': {
                    operation: 'import/upload'
                },
                'convert-to-pdf': {
                    operation: 'convert',
                    input: 'import-docx',
                    output_format: 'pdf',
                    engine: 'office',
                    filename: 'prihlaska-KHK.pdf'
                },
                'export-pdf': {
                    operation: 'export/url',
                    input: 'convert-to-pdf'
                }
            }
        });
        
        // Upload the filled DOCX
        const uploadTask = job.tasks.filter(task => task.operation === 'import/upload')[0];
        await cloudConvert.tasks.upload(uploadTask, filledDocxBuffer, 'prihlaska.docx');
        
        // Wait for the job to complete
        const completedJob = await cloudConvert.jobs.wait(job.id);
        
        // Get the PDF from export task
        const exportTask = completedJob.tasks.filter(task => task.operation === 'export/url')[0];
        const pdfUrl = exportTask.result.files[0].url;
        
        // Download the PDF
        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok) {
            throw new Error(`Failed to download converted PDF: ${pdfResponse.status}`);
        }
        
        const pdfBytes = await pdfResponse.arrayBuffer();
        return pdfBytes;
        
    } catch (error) {
        console.error('CloudConvert error:', error);
        throw new Error(`PDF conversion failed: ${error.message}`);
    }
}

export async function onRequest(context) {
    const { request, env } = context;

    try {
        const requestData = await request.json();

        let toEmail = 'vitekform@gmail.com';
        let ccEmail = requestData['Email zástupce pro komunikaci'] || requestData['Email'];

        // Create PDF with form data using template
        const pdfBytes = await createFormPDFFromTemplate(requestData, request, env);

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
