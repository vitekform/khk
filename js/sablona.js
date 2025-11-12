// sablona.js - Form handling script

document.addEventListener('DOMContentLoaded', function() {
    // Initialize form
    const form = document.getElementById('frmPrihlaska');
    const btnIC = document.getElementById('btnIC');
    const txtIC = document.getElementById('txtIC');
    const btnSubmit = document.getElementById('btnSubmit');
    const cbPersonalize = document.getElementById('cbPersonalize');
    const cbAdresa = document.getElementById('cbAdresa');
    const cbKontakt = document.getElementById('cbKontakt');
    const addButton = document.getElementById('add');

    // Handle IČ button click - load data from RES
    if (btnIC) {
        btnIC.addEventListener('click', function(e) {
            e.preventDefault();
            const ic = txtIC.value.trim();
            
            if (ic.length === 8) {
                // Call API to get details
                fetch('/api/getDetails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ ico: ic })
                })
                .then(response => response.json())
                .then(data => {
                    // Populate form fields
                    if (data.name) {
                        const adresa = document.getElementById('adresa');
                        if (adresa) {
                            adresa.textContent = `${data.name}\n${data.street} ${data.address_num}\n${data.city}, ${data.psc}`;
                        }
                        
                        const forma = document.getElementById('forma');
                        if (forma) {
                            forma.textContent = data.legal_form || 'Nezjištěno';
                        }

                        // Update hidden fields if needed
                        const txtNazevSubjektu = document.getElementById('txtNazevSubjektu');
                        if (txtNazevSubjektu) {
                            txtNazevSubjektu.value = data.name;
                        }
                    }
                })
                .catch(error => {
                    console.error('Error fetching company details:', error);
                    alert('Nepodařilo se načíst údaje z RES. Zkuste to prosím znovu.');
                });
            } else {
                alert('Zadejte prosím platné 8-místné IČ.');
            }
        });
    }

    // Handle checkbox for address toggle
    if (cbAdresa) {
        cbAdresa.addEventListener('change', function() {
            const hideableDiv = this.parentElement.querySelector('.hidenable');
            if (hideableDiv) {
                if (this.checked) {
                    hideableDiv.style.display = 'none';
                } else {
                    hideableDiv.style.display = 'block';
                }
            }
        });
    }

    // Handle checkbox for contact person toggle
    if (cbKontakt) {
        cbKontakt.addEventListener('change', function() {
            const hideableDiv = this.parentElement.querySelector('.hidenable');
            if (hideableDiv) {
                if (this.checked) {
                    hideableDiv.style.display = 'none';
                } else {
                    hideableDiv.style.display = 'block';
                }
            }
        });
    }

    // Handle personalization checkbox - enable/disable submit button
    if (cbPersonalize) {
        cbPersonalize.addEventListener('change', function() {
            if (btnSubmit) {
                btnSubmit.disabled = !this.checked;
            }
        });
    }

    // Handle add person button
    if (addButton) {
        addButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Add new contact person fields
            const box4 = this.closest('.box4');
            const newPerson = document.createElement('div');
            newPerson.className = 'box2';
            newPerson.innerHTML = `
                <h5>Další kontaktní osoba</h5>
                <div class="oddel"></div>
                <input type="text" name="txtJmeno" placeholder="Jméno a Příjmení" list="lOsoby">
                <input type="text" name="txtFunkce" placeholder="Funkce">
                <input type="tel" name="txtTel" placeholder="Telefonní číslo">
                <input type="email" name="txtEmail" placeholder="E-mail">
            `;
            box4.insertBefore(newPerson, this.parentElement);
        });
    }

    // Handle form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!cbPersonalize.checked) {
                alert('Musíte souhlasit se zpracováním osobních údajů.');
                return;
            }

            // Collect form data
            const formData = new FormData(form);
            const data = {};
            
            // Convert FormData to object
            for (let [key, value] of formData.entries()) {
                if (data[key]) {
                    // If key exists, convert to array
                    if (Array.isArray(data[key])) {
                        data[key].push(value);
                    } else {
                        data[key] = [data[key], value];
                    }
                } else {
                    data[key] = value;
                }
            }

            // Add additional fields
            data.ic = txtIC ? txtIC.value : '';

            // Submit to API
            fetch('/api/submitForm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (response.ok) {
                    alert('Přihláška byla úspěšně odeslána. Děkujeme!');
                    window.location.href = 'https://www.komora-khk.cz/';
                } else {
                    throw new Error('Chyba při odesílání formuláře');
                }
            })
            .catch(error => {
                console.error('Error submitting form:', error);
                alert('Nepodařilo se odeslat přihlášku. Zkuste to prosím znovu.');
            });
        });
    }

    // Add tooltip functionality for data-message attributes
    const elementsWithMessages = document.querySelectorAll('[data-message]');
    elementsWithMessages.forEach(element => {
        element.title = element.getAttribute('data-message');
    });

    // Initialize datalist with sample data (if needed)
    const lOsoby = document.getElementById('lOsoby');
    if (lOsoby) {
        // Could be populated dynamically if needed
    }

    // Load NACE codes (placeholder - would need actual data)
    const naceElement = document.getElementById('nace');
    if (naceElement) {
        naceElement.innerHTML = `
            <label><input type="checkbox" name="nace" value="A"> A - Zemědělství, lesnictví a rybářství</label><br>
            <label><input type="checkbox" name="nace" value="B"> B - Těžba a dobývání</label><br>
            <label><input type="checkbox" name="nace" value="C"> C - Zpracovatelský průmysl</label><br>
            <label><input type="checkbox" name="nace" value="D"> D - Výroba a rozvod elektřiny, plynu, tepla a klimatizovaného vzduchu</label><br>
            <label><input type="checkbox" name="nace" value="E"> E - Zásobování vodou; činnosti související s odpady a sanacemi</label><br>
            <label><input type="checkbox" name="nace" value="F"> F - Stavebnictví</label><br>
            <label><input type="checkbox" name="nace" value="G"> G - Velkoobchod a maloobchod; opravy a údržba motorových vozidel</label><br>
            <label><input type="checkbox" name="nace" value="H"> H - Doprava a skladování</label><br>
            <label><input type="checkbox" name="nace" value="I"> I - Ubytování, stravování a pohostinství</label><br>
            <label><input type="checkbox" name="nace" value="J"> J - Informační a komunikační činnosti</label><br>
        `;
    }

    // Load Data Box options (placeholder)
    const txtDS = document.getElementById('txtDS');
    if (txtDS) {
        txtDS.innerHTML = `
            <option value="">-- Vyberte --</option>
            <option value="ano">Ano, máme datovou schránku</option>
            <option value="ne">Ne, nemáme datovou schránku</option>
        `;
    }
});
