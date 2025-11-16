import { useState, useEffect } from 'react'
import './App.css'
import countryList from "react-select-country-list";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { LEGAL_FORM_OPTIONS } from './legalForms';


function App() {

    const MAX_PAGES = 12;

    // Map pages to steps (4 main stages)
    function getStepFromPage(page) {
        if (page <= 2) return 1;      // Basic info & Company details
        if (page <= 6) return 2;      // Contact & Registration details
        if (page <= 9) return 3;      // Business information
        return 4;                     // Export/Import countries
    }

    const [page, setPage] = useState(0)
    const [ico, setIco] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [dic, setDic] = useState("")
    const [street_and_number, setStreet_and_number] = useState("")
    const [state, setState] = useState("")
    const [city, setCity] = useState("")
    const [zip, setZip] = useState("")
    const [regDate, setRegDate] = useState("")
    const [regPlace, setRegPlace] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [phoneStatutary, setPhoneStatutary] = useState("")
    const [emailStatutary, setEmailStatutary] = useState("")
    const [functionStatutary, setFunctionStatutary] = useState("")
    const [legalForm, setLegalForm] = useState("")
    const [web, setWeb] = useState("")
    const [mark, setMark] = useState("") // spisová značka
    const [nameStatuary, setNameStatuary] = useState("")
    const [nameMeeting, setNameMeeting] = useState("")
    const [phoneMeeting, setPhoneMeeting] = useState("")
    const [emailMeeting, setEmailMeeting] = useState("")
    const [functionMeeting, setFunctionMeeting] = useState("")
    const [employeeNum, setEmployeeNum] = useState("Bez Zaměstnanců")
    const [income, setIncome] = useState("Do 1,5 mil")
    const [import_, setImport] = useState("Do 1,5 mil")
    const [export_, setExport] = useState("Do 1,5 mil")
    const [industry, setIndustry] = useState("")
    const [exportCountries, setExportCountries] = useState([])
    const [importCountries, setImportCountries] = useState([])
    const [czNaceOptions, setCzNaceOptions] = useState([])
    const [czNaceMap, setCzNaceMap] = useState({})
    const countryOptions = countryList().getData();

    // Load CZ-NACE data from CSV on component mount
    useEffect(() => {
        fetch('/cz_nace_no_dots.csv')
            .then(response => response.text())
            .then(csvText => {
                const lines = csvText.split('\n');
                const options = [];
                const map = {};
                const seenDescriptions = new Set();
                
                // Skip header line
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    // Parse CSV line (handle commas in quotes)
                    const match = line.match(/^([^,]+),(.+)$/);
                    if (match) {
                        const code = match[1].trim();
                        const description = match[2].replace(/^"(.*)"$/, '$1').trim();
                        
                        // Only add unique descriptions to options
                        if (!seenDescriptions.has(description)) {
                            options.push({
                                value: description,
                                label: description,
                                code: code
                            });
                            seenDescriptions.add(description);
                        }
                        
                        // Keep all code-to-description mappings for code conversion
                        map[code] = description;
                    }
                }
                
                // Sort options alphabetically by description
                options.sort((a, b) => a.label.localeCompare(b.label, 'cs'));
                
                setCzNaceOptions(options);
                setCzNaceMap(map);
            })
            .catch(error => {
                console.error('Error loading CZ-NACE data:', error);
            });
    }, []);

    function fetchDetailsFromICO() {
        fetch("/api/getDetails", {body: JSON.stringify({"ico": ico}), method: "POST", headers: {
            "Content-Type": "application/json"
            }}).then(async (res) => {
            let json = await res.json();
            setCompanyName(json.name);
            setDic(json.dic);
            let ulice = json.street;
            let cislo = json.address_num;
            setStreet_and_number(ulice + " " + cislo);
            setState(json.state);
            setCity(json.city);
            setZip(json.psc);
            setLegalForm(json.legal_form);
            setRegDate(json.reg_date);
            setMark(json.znacka);
        })
    }

    function handleNext() {
        // check if all fields are filled (marked as required in the input)
        let invalid = false;
        document.querySelectorAll('.form-content input').forEach(input => {
            if (!input.checkValidity()) {
                input.reportValidity();
                invalid = true;
            }
        });

        // Special validation for page 4 (legal form select)
        if (page === 4 && !legalForm) {
            alert("Prosím vyberte právní formu!");
            invalid = true;
        }

        // Special validation for page 9 (industry field)
        if (page === 9 && !industry) {
            alert("Prosím zadejte převažující obor činnosti!");
            invalid = true;
        }

        if (!invalid) {
            if (page === 0) {
                fetchDetailsFromICO();
            }
            setPage(page + 1);
        }
        else {
            alert("Prosím prvně vyplňte nutná pole!");
        }

    }

    function handleBack() {
        setPage(page - 1);
    }

    function handleIndustryChange(newValue, actionMeta) {
        if (actionMeta.action === 'select-option' || actionMeta.action === 'create-option') {
            const inputValue = newValue ? newValue.value : '';
            
            // Check if the input is a code and convert it to description
            if (czNaceMap[inputValue]) {
                setIndustry(czNaceMap[inputValue]);
            } else {
                setIndustry(inputValue);
            }
        } else if (actionMeta.action === 'clear') {
            setIndustry('');
        }
    }

    function handleSubmit() {
        // Create JSON with all data
        const data = {
            "IČ": ico,
            "Název Firmy": companyName,
            "DIČ": dic,
            "Ulice a Číslo": street_and_number,
            "Kraj": state,
            "Město": city,
            "PSČ": zip,
            "Telefon": phone,
            "Email": email,
            "Statutární zástupce": nameStatuary,
            "Telefon statutárního zástupce": phoneStatutary,
            "Email statutárního zástupce": emailStatutary,
            "Funkce statutárního zástupce": functionStatutary,
            "Právní Forma": legalForm,
            "WWW Stránky": web,
            "Datum registrace v obchodním rejstříku nebo u živnostenského úřadu": regDate,
            "Místo registrace v obchodním rejstříku nebo u živnostenského úřadu": regPlace,
            "Spisová značka": mark,
            "Jméno zástupce pro jednání": nameMeeting,
            "Telefon zástupce pro jednání": phoneMeeting,
            "Email zástupce pro jednání": emailMeeting,
            "Funkce zástupce pro jednání": functionMeeting,
            "Množství zaměstanců": employeeNum,
            "Čistý obrat (Kč)": income,
            "Import (Kč)": import_,
            "Export (Kč)": export_,
            "Převažující obor činnosti dle CZ-NACE": industry,
            "Země, kam exportujete/chcete exportovat": exportCountries.map(c => c.label),
            "Země, odkuď importujete/chcete importovat": importCountries.map(c => c.label)
        }

        fetch("/api/submitForm", {body: JSON.stringify(data), method: "POST", headers: {
            "Content-Type": "application/json"
        }}).then(async (res) => {
            if (res.ok) {
                alert("Formulář byl úspěšně odeslán. Děkujeme!");
                // Redirect to khkpce.cz
                window.location.href = "https://khkpce.cz";
            }
        })
    }

    function getHTMLContent(page) {
        if (page === 0) {
            return (
                <>
                    <h2 className="section-title">Identifikační číslo</h2>
                    <div className="question-card">
                        <label className="question">Prosím, zadejte vaše IČO</label>
                        <input
                            type="text"
                            onChange={e => {setIco(e.target.value)}}
                            className="answer-input"
                            inputMode="numeric"
                            pattern="\d{8}"
                            maxLength="8"
                            placeholder="Vaše IČO"
                            required
                            value={ico}
                        />
                    </div>
                </>
            )
        }
        else if (page === 1) {
            return (
                <>
                    <h2 className="section-title">Subjekt</h2>
                    <div className="question-card">
                        <label className="question">Jméno firmy</label>
                        <input
                        type="text"
                        onChange={e => {setCompanyName(e.target.value)}}
                        required
                        placeholder="Jméno Firmy"
                        value={companyName}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">DIČ firmy</label>
                        <input
                            type="text"
                            onChange={e => {setDic(e.target.value)}}
                            required
                            placeholder="DIČ Firmy"
                            value={dic}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Ulice a číslo popisné</label>
                        <input
                            type="text"
                            onChange={e => {setStreet_and_number(e.target.value)}}
                            required
                            placeholder="Ulice a Číslo popisné"
                            value={street_and_number}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Kraj</label>
                        <input
                            type="text"
                            onChange={e => {setState(e.target.value)}}
                            required
                            placeholder="Kraj"
                            value={state}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Obec</label>
                        <input
                            type="text"
                            onChange={e => {setCity(e.target.value)}}
                            required
                            placeholder="Obec"
                            value={city}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">PSČ</label>
                        <input
                            type="text"
                            onChange={e => {setZip(e.target.value)}}
                            required
                            placeholder="PSČ"
                            value={zip}>
                        </input>
                    </div>
                </>
            )
        }
        else if (page === 2) {
            return (
                <>
                    <h2 className="section-title">Korespondenční adresa</h2>
                    <div className="question-card">
                        <label className="question">Kontaktní telefon</label>
                        <input
                            type="tel"
                            onChange={e => {setPhone(e.target.value)}}
                            required
                            placeholder="+420 777 777 777"
                            value={phone}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní email</label>
                        <input
                            type="email"
                            onChange={e => {setEmail(e.target.value)}}
                            required
                            placeholder="pepa.novak@gmail.com"
                            value={email}>
                        </input>
                    </div>
                </>
            )
        }
        else if (page === 3) {
            return (
                <>
                    <h2 className="section-title">Statutární zástupce</h2>
                    <div className="question-card">
                        <label className="question">Jméno statutárního zástupce</label>
                        <input
                            type={"text"}
                            onChange={e => {setNameStatuary(e.target.value)}}
                            required
                            placeholder="Josef Novák"
                            value={nameStatuary}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní telefon statutárního zástupce</label>
                        <input
                            type="tel"
                            onChange={e => {setPhoneStatutary(e.target.value)}}
                            required
                            placeholder="+420 777 777 777"
                            value={phoneStatutary}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní email statutárního zástupce</label>
                        <input
                            type="email"
                            onChange={e => {setEmailStatutary(e.target.value)}}
                            required
                            placeholder="pepa.novak@gmail.com"
                            value={emailStatutary}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Funkce statutárního zástupce</label>
                        <input
                            type="text"
                            onChange={e => {setFunctionStatutary(e.target.value)}}
                            required
                            placeholder="Funkce statutárního zástupce"
                            value={functionStatutary}>
                        </input>
                    </div>
                </>
            )
        }
        else if (page === 4) {
            return (
                <>
                    <h2 className="section-title">Právní forma</h2>
                    <div className="question-card">
                        <label className="question">Právní forma</label>
                        <Select
                            options={LEGAL_FORM_OPTIONS}
                            value={legalForm ? LEGAL_FORM_OPTIONS.find(opt => opt.value === legalForm) : null}
                            onChange={(selectedOption) => setLegalForm(selectedOption ? selectedOption.value : "")}
                            placeholder="Vyberte právní formu"
                            isClearable
                        />
                    </div>
                </>
            )
        }
        else if (page === 5) {
            return (
                <>
                    <h2 className="section-title">Webové stránky</h2>
                    <div className="question-card">
                        <label className="question">Vaše webové stránky</label>
                        <input
                            type={"text"}
                            onChange={e => {setWeb(e.target.value)}}
                            placeholder="Adresa vašich webových stránek"
                            value={web}>
                        </input>
                    </div>
                </>
            )
        }
        else if (page === 6) {
            return (
                <>
                    <h2 className="section-title">Registrační údaje</h2>
                    <div className="question-card">
                        <label className="question">Datum registrace v obchodním rejstříku nebo u živnostenského úřadu</label>
                        <input
                            type={"date"}
                            onChange={e => {setRegDate(e.target.value)}}
                            placeholder="Datum registrace"
                            value={regDate}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Místo registrace v obchodním rejstříku nebo u živnostenského úřadu</label>
                        <input
                            type={"text"}
                            onChange={e => {setRegPlace(e.target.value)}}
                            placeholder="Místo registrace"
                            value={regPlace}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Spisová značka</label>
                        <input
                            type={"text"}
                            onChange={e => {setMark(e.target.value)}}
                            placeholder="Spisová značka"
                            value={mark}>
                        </input>
                    </div>
                </>
            )
        }
        else if (page === 7) {
            return (
                <>
                    <h2 className="section-title">Zástupce pro jednání</h2>
                    <div className="question-card">
                        <label className="question">Jméno zástupce pro jednání</label>
                        <input
                            type={"text"}
                            onChange={e => {setNameMeeting(e.target.value)}}
                            required
                            placeholder="Josef Novák"
                            value={nameMeeting}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní telefon zástupce pro jednání</label>
                        <input
                            type="tel"
                            onChange={e => {setPhoneMeeting(e.target.value)}}
                            required
                            placeholder="+420 777 777 777"
                            value={phoneMeeting}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní email zástupce pro jednání</label>
                        <input
                            type="email"
                            onChange={e => {setEmailMeeting(e.target.value)}}
                            required
                            placeholder="pepa.novak@gmail.com"
                            value={emailMeeting}>
                        </input>
                    </div>
                    <div className="question-card">
                        <label className="question">Funkce zástupce pro jednání</label>
                        <input
                            type="text"
                            onChange={e => {setFunctionMeeting(e.target.value)}}
                            required
                            placeholder="Funkce zástupce pro jednání"
                            value={functionMeeting}>
                        </input>
                    </div>
                </>
            )
        }
        else if (page === 8) {
            return (
                <>
                    <h2 className="section-title">Informace o podniku</h2>
                    <div className="question-card">
    <label className="question">Počet zaměstnanců</label>
    <label><input type="radio" name="employeeNum" onChange={e => setEmployeeNum(e.target.value)} value="Bez Zaměstnanců" checked={employeeNum === "Bez Zaměstnanců"} /> Bez Zaměstnanců</label>
    <label><input type="radio" name="employeeNum" onChange={e => setEmployeeNum(e.target.value)} value="1-9 Zaměstnanců" checked={employeeNum === "1-9 Zaměstnanců"} /> 1-9 Zaměstnanců</label>
    <label><input type="radio" name="employeeNum" onChange={e => setEmployeeNum(e.target.value)} value="10-49 Zaměstnanců" checked={employeeNum === "10-49 Zaměstnanců"} /> 10-49 Zaměstnanců</label>
    <label><input type="radio" name="employeeNum" onChange={e => setEmployeeNum(e.target.value)} value="50-249 Zaměstnanců" checked={employeeNum === "50-249 Zaměstnanců"} /> 50-249 Zaměstnanců</label>
    <label><input type="radio" name="employeeNum" onChange={e => setEmployeeNum(e.target.value)} value="250-999 Zaměstnanců" checked={employeeNum === "250-999 Zaměstnanců"} /> 250 až 999 Zaměstnanců</label>
    <label><input type="radio" name="employeeNum" onChange={e => setEmployeeNum(e.target.value)} value="Více než 1 000 Zaměstnanců" checked={employeeNum === "Více než 1 000 Zaměstnanců"} /> Více než 1 000 Zaměstnanců</label>
</div>

<div className="question-card">
    <label className="question">Čistý Obrat (Kč)</label>
    <label><input type="radio" name="income" onChange={e => setIncome(e.target.value)} value="do 1,5 mil" checked={income === "do 1,5 mil"} /> do 1,5 mil</label>
    <label><input type="radio" name="income" onChange={e => setIncome(e.target.value)} value="1,5 - 18 miliónů" checked={income === "1,5 - 18 miliónů"} /> 1,5 - 18 miliónů</label>
    <label><input type="radio" name="income" onChange={e => setIncome(e.target.value)} value="18 - 50 miliónů" checked={income === "18 - 50 miliónů"} /> 18 - 50 miliónů</label>
    <label><input type="radio" name="income" onChange={e => setIncome(e.target.value)} value="50 - 100 miliónů" checked={income === "50 - 100 miliónů"} /> 50 - 100 miliónů</label>
    <label><input type="radio" name="income" onChange={e => setIncome(e.target.value)} value="100 - 200 miliónů" checked={income === "100 - 200 miliónů"} /> 100 - 200 miliónů</label>
    <label><input type="radio" name="income" onChange={e => setIncome(e.target.value)} value="200 miliónů - 1 miliarda" checked={income === "200 miliónů - 1 miliarda"} /> 200 miliónů - 1 miliarda</label>
    <label><input type="radio" name="income" onChange={e => setIncome(e.target.value)} value="Více než 1 miliarda" checked={income === "Více než 1 miliarda"} /> Více než 1 miliarda</label>
</div>

<div className="question-card">
    <label className="question">Import (Kč)</label>
    <label><input type="radio" name="import" onChange={e => setImport(e.target.value)} value="do 1,5 mil" checked={import_ === "do 1,5 mil"} /> do 1,5 mil</label>
    <label><input type="radio" name="import" onChange={e => setImport(e.target.value)} value="1,5 - 18 miliónů" checked={import_ === "1,5 - 18 miliónů"} /> 1,5 - 18 miliónů</label>
    <label><input type="radio" name="import" onChange={e => setImport(e.target.value)} value="18 - 50 miliónů" checked={import_ === "18 - 50 miliónů"} /> 18 - 50 miliónů</label>
    <label><input type="radio" name="import" onChange={e => setImport(e.target.value)} value="50 - 100 miliónů" checked={import_ === "50 - 100 miliónů"} /> 50 - 100 miliónů</label>
    <label><input type="radio" name="import" onChange={e => setImport(e.target.value)} value="100 - 300 miliónů" checked={import_ === "100 - 300 miliónů"} /> 100 - 300 miliónů</label>
    <label><input type="radio" name="import" onChange={e => setImport(e.target.value)} value="300 miliónů - 1 miliarda" checked={import_ === "300 miliónů - 1 miliarda"} /> 300 miliónů - 1 miliarda</label>
    <label><input type="radio" name="import" onChange={e => setImport(e.target.value)} value="Více než 1 miliarda" checked={import_ === "Více než 1 miliarda"} /> Více než 1 miliarda</label>
</div>

<div className="question-card">
    <label className="question">Export (Kč)</label>
    <label><input type="radio" name="export" onChange={e => setExport(e.target.value)} value="do 1,5 mil" checked={export_ === "do 1,5 mil"} /> do 1,5 mil</label>
    <label><input type="radio" name="export" onChange={e => setExport(e.target.value)} value="1,5 - 18 miliónů" checked={export_ === "1,5 - 18 miliónů"} /> 1,5 - 18 miliónů</label>
    <label><input type="radio" name="export" onChange={e => setExport(e.target.value)} value="18 - 50 miliónů" checked={export_ === "18 - 50 miliónů"} /> 18 - 50 miliónů</label>
    <label><input type="radio" name="export" onChange={e => setExport(e.target.value)} value="50 - 100 miliónů" checked={export_ === "50 - 100 miliónů"} /> 50 - 100 miliónů</label>
    <label><input type="radio" name="export" onChange={e => setExport(e.target.value)} value="100 - 300 miliónů" checked={export_ === "100 - 300 miliónů"} /> 100 - 300 miliónů</label>
    <label><input type="radio" name="export" onChange={e => setExport(e.target.value)} value="300 miliónů - 1 miliarda" checked={export_ === "300 miliónů - 1 miliarda"} /> 300 miliónů - 1 miliarda</label>
    <label><input type="radio" name="export" onChange={e => setExport(e.target.value)} value="Více než 1 miliarda" checked={export_ === "Více než 1 miliarda"} /> Více než 1 miliarda</label>
</div>
                </>
            )
        }
        else if (page === 9) {
            return (
                <>
                    <h2 className="section-title">Obor činnosti</h2>
                    <div className="question-card">
                        <label className="question">Převažující obor činnosti dle CZ-NACE</label>
                        <CreatableSelect
                            options={czNaceOptions}
                            value={industry ? { value: industry, label: industry } : null}
                            onChange={handleIndustryChange}
                            placeholder="Začněte psát popis nebo kód oboru činnosti..."
                            isClearable
                            formatCreateLabel={(inputValue) => `Použít: "${inputValue}"`}
                        />
                    </div>
                </>
            )
        }
        else if (page === 10) {
            return (
                <>
                    <h2 className="section-title">Exportní země</h2>
                    <div className="question-card">
                        <label className="question">Uveďte země, kam exportujete/chcete exportovat</label>
                        <Select
                            isMulti
                            options={countryOptions}
                            value={exportCountries}
                            onChange={setExportCountries}
                            placeholder="Začněte psát název země..."
                        />
                    </div>
                </>
            );
        }
        else if (page === 11) {
            return (
                <>
                    <h2 className="section-title">Importní země</h2>
                    <div className="question-card">
                        <label className="question">Uveďte země, odkuď importujete/chcete importovat</label>
                        <Select
                            isMulti
                            options={countryOptions}
                            value={importCountries}
                            onChange={setImportCountries}
                            placeholder="Začněte psát název země..."
                        />
                    </div>
                </>
            );
        }
    }
  return (
    <>
        <div className="form-wrapper">
            <div className="step-guide">
                <div className="step-guide-container">
                    <div className={`step-item ${getStepFromPage(page) >= 1 ? 'active' : ''} ${getStepFromPage(page) > 1 ? 'completed' : ''}`}>
                        <div className="step-icon">{getStepFromPage(page) > 1 ? '✓' : '1'}</div>
                        <div className="step-title">Základní údaje</div>
                        <div className="step-description">IČO a adresa subjektu</div>
                    </div>
                    <div className={`step-item ${getStepFromPage(page) >= 2 ? 'active' : ''} ${getStepFromPage(page) > 2 ? 'completed' : ''}`}>
                        <div className="step-icon">{getStepFromPage(page) > 2 ? '✓' : '2'}</div>
                        <div className="step-title">Kontaktní údaje</div>
                        <div className="step-description">Zástupci a registrace</div>
                    </div>
                    <div className={`step-item ${getStepFromPage(page) >= 3 ? 'active' : ''} ${getStepFromPage(page) > 3 ? 'completed' : ''}`}>
                        <div className="step-icon">{getStepFromPage(page) > 3 ? '✓' : '3'}</div>
                        <div className="step-title">Podnikání</div>
                        <div className="step-description">Zaměstnanci a obrat</div>
                    </div>
                    <div className={`step-item ${getStepFromPage(page) >= 4 ? 'active' : ''} ${getStepFromPage(page) > 4 ? 'completed' : ''}`}>
                        <div className="step-icon">{getStepFromPage(page) > 4 ? '✓' : '4'}</div>
                        <div className="step-title">Zahraniční obchod</div>
                        <div className="step-description">Import a export</div>
                    </div>
                </div>
            </div>

            <div className="form-container">
                <div className="form-header">
                    <h1 className="form-title">Registrační formulář</h1>
                    <p className="form-description">Vyplňte prosím všechny údaje o vaší firmě</p>
                </div>

                <div className="form-content">
                    {getHTMLContent(page)}
                </div>

                <div className="form-navigation">
                    {page > 0 && (
                        <button
                            type="button"
                            className="btn-back"
                            onClick={handleBack}
                        >
                            Zpět
                        </button>
                    )}
                    {page + 1 < MAX_PAGES && (
                        <button
                            type="button"
                            className="btn-next"
                            onClick={handleNext}
                        >
                            Další
                        </button>
                    )}
                    {page + 1 === MAX_PAGES && (
                        <button
                            type="submit"
                            className="btn-submit"
                            onClick={handleSubmit}
                        >
                            Odeslat
                        </button>
                    )}
                </div>

                <div className="form-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{width: `${((page + 1) / MAX_PAGES) * 100}%`}}
                        ></div>
                    </div>
                    <p className="progress-text">Krok {page + 1} z {MAX_PAGES}</p>
                </div>
            </div>
        </div>
    </>
  )
}

export default App
