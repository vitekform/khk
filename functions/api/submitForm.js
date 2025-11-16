// Function to convert JSON object to CSV format
function jsonToCSV(data) {
    const headers = Object.keys(data);
    const values = Object.values(data).map(value => {
        // Handle arrays (like exportCountries, importCountries)
        if (Array.isArray(value)) {
            return `"${value.join(', ')}"`;
        }
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    });
    
    return headers.join(',') + '\n' + values.join(',');
}

export async function onRequest(context) {
    const {request, env} = context;

        return new Response(JSON.stringify({ success: true, message: "API Key: " + env.MAILGUN_API_KEY + " Domain: " + env.MAILGUN_DOMAIN + "." }), {
            headers: { "Content-Type": "application/json" },
            status: 200
        });

    try {
        const requestData = await request.json();
        
        // Convert JSON data to CSV
        const csvContent = jsonToCSV(requestData);
        
        // Check if MailGun credentials are configured
        if (!env.MAILGUN_API_KEY || !env.MAILGUN_DOMAIN) {
            throw new Error("MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables must be configured");
        }

        // Prepare form data for MailGun API
        const formData = new FormData();
        formData.append('from', `KHK Form System <noreply@${env.MAILGUN_DOMAIN}>`);
        formData.append('to', 'vitekform@gmail.com');
        formData.append('subject', 'Somebody filled out form');
        formData.append('text', 'A new form has been submitted. Please see the attached CSV file for details.');
        
        // Add CSV as attachment
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('attachment', csvBlob, 'form-submission.csv');

        // Send email via MailGun API
        const mailgunUrl = `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;
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

        return new Response(JSON.stringify({ success: true, message: "Form submitted successfully" }), {
            headers: { "Content-Type": "application/json" },
            status: 200
        });

    } catch (error) {
        console.error("Error in submitForm:", error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), {
            headers: { "Content-Type": "application/json" },
            status: 500
        });
    }
}
