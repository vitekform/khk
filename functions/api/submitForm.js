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

    try {
        const requestData = await request.json();
        
        // Convert JSON data to CSV
        const csvContent = jsonToCSV(requestData);
        
        // Prepare email using MailChannels API (commonly used with Cloudflare)
        const emailPayload = {
            personalizations: [
                {
                    to: [{ email: "vitekform@gmail.com" }],
                }
            ],
            from: {
                email: env.SENDER_EMAIL || "noreply@khkpce.cz",
                name: "KHK Form System"
            },
            subject: "Somebody filled out form",
            content: [
                {
                    type: "text/plain",
                    value: "A new form has been submitted. Please see the attached CSV file for details."
                }
            ],
            attachments: [
                {
                    content: btoa(csvContent), // Base64 encode the CSV
                    filename: "form-submission.csv",
                    type: "text/csv",
                    disposition: "attachment"
                }
            ]
        };

        // Send email via MailChannels API
        const emailResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(emailPayload)
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