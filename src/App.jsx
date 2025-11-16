import { useState } from 'react'
import './App.css'
import countryList from "react-select-country-list";
import Select from "react-select";
import { LEGAL_FORM_OPTIONS } from './legalForms';


function App() {

    const [isLoading, setIsLoading] = useState(false)
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
    const [industry, setIndustry] = useState([])
    const [naceOptions, setNaceOptions] = useState([])
    const [exportCountries, setExportCountries] = useState([])
    const [importCountries, setImportCountries] = useState([])
    const [emailTo, setEmailTo] = useState("")
    const countryOptions = countryList().getData();

    function fetchDetailsFromICO() {
        if (!ico || ico.length !== 8) {
            alert("Prosím zadejte platné 8-místné IČO");
            return;
        }
        
        setIsLoading(true);
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
        }).catch(() => {
            alert("Nepodařilo se načíst data z IČO");
        }).finally(() => {
            setIsLoading(false);
        });
        
        // Fetch NACE data
        fetch("/api/getCZNACE", {body: JSON.stringify({"ico": ico}), method: "POST", headers: {
            "Content-Type": "application/json"
            }}).then(async (res) => {
            let json = await res.json();
            if (json.nace && Array.isArray(json.nace)) {
                // Transform NACE data to react-select format
                const options = json.nace.map(item => ({
                    value: `${item.kod} - ${item.text}`,
                    label: `${item.kod} - ${item.text}`
                }));
                setNaceOptions(options);
            }
        }).catch(() => {
            // Silently fail if NACE data cannot be fetched
            // User can still manually enter industry information if needed
        })
    }

    function handleSubmit(e) {
        e.preventDefault();
        
        // Validate required fields
        if (!ico || !companyName || !dic || !street_and_number || !state || !city || !zip ||
            !phone || !email || !nameStatuary || !phoneStatutary || !emailStatutary || 
            !functionStatutary || !legalForm || !regDate || !regPlace || !mark ||
            !nameMeeting || !phoneMeeting || !emailMeeting || !functionMeeting || 
            industry.length === 0 || !emailTo) {
            alert("Prosím vyplňte všechna povinná pole!");
            return;
        }
        
        // Create JSON with all data
        const data = {
            "emailTo": emailTo,
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
            "Převažující obor činnosti dle CZ-NACE": industry.map(i => i.label),
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

  return (
    <>
        <div className="form-wrapper">
            <div className="step-guide">
                <div className="step-guide-container">
                    <div className="step-item active">
                        <div className="step-icon">1</div>
                        <div className="step-title">Základní údaje</div>
                        <div className="step-description">IČO a adresa subjektu</div>
                    </div>
                    <div className="step-item">
                        <div className="step-icon">2</div>
                        <div className="step-title">Kontaktní údaje</div>
                        <div className="step-description">Zástupci a registrace</div>
                    </div>
                    <div className="step-item">
                        <div className="step-icon">3</div>
                        <div className="step-title">Podnikání</div>
                        <div className="step-description">Zaměstnanci a obrat</div>
                    </div>
                    <div className="step-item">
                        <div className="step-icon">4</div>
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

                <form onSubmit={handleSubmit} className="form-content">
                    {/* Section 1: ICO */}
                    <h2 className="section-title">Identifikační číslo</h2>
                    <div className="question-card">
                        <label className="question">Prosím, zadejte vaše IČO</label>
                        <div style={{display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
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
                                style={{flex: 1}}
                            />
                            <button
                                type="button"
                                className="btn-load"
                                onClick={fetchDetailsFromICO}
                                disabled={isLoading || ico.length !== 8}
                            >
                                {isLoading ? 'Načítám...' : 'Načíst'}
                            </button>
                        </div>
                    </div>

                    {/* Section 2: Company Details */}
                    <h2 className="section-title">Subjekt</h2>
                    <div className="question-card">
                        <label className="question">Jméno firmy</label>
                        <input
                            type="text"
                            onChange={e => {setCompanyName(e.target.value)}}
                            required
                            placeholder="Jméno Firmy"
                            value={companyName}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">DIČ firmy</label>
                        <input
                            type="text"
                            onChange={e => {setDic(e.target.value)}}
                            required
                            placeholder="DIČ Firmy"
                            value={dic}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Ulice a číslo popisné</label>
                        <input
                            type="text"
                            onChange={e => {setStreet_and_number(e.target.value)}}
                            required
                            placeholder="Ulice a Číslo popisné"
                            value={street_and_number}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Kraj</label>
                        <input
                            type="text"
                            onChange={e => {setState(e.target.value)}}
                            required
                            placeholder="Kraj"
                            value={state}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Obec</label>
                        <input
                            type="text"
                            onChange={e => {setCity(e.target.value)}}
                            required
                            placeholder="Obec"
                            value={city}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">PSČ</label>
                        <input
                            type="text"
                            onChange={e => {setZip(e.target.value)}}
                            required
                            placeholder="PSČ"
                            value={zip}
                        />
                    </div>

                    {/* Section 3: Contact Info */}
                    <h2 className="section-title">Korespondenční adresa</h2>
                    <div className="question-card">
                        <label className="question">Kontaktní telefon</label>
                        <input
                            type="tel"
                            onChange={e => {setPhone(e.target.value)}}
                            required
                            placeholder="+420 777 777 777"
                            value={phone}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní email</label>
                        <input
                            type="email"
                            onChange={e => {setEmail(e.target.value)}}
                            required
                            placeholder="pepa.novak@gmail.com"
                            value={email}
                        />
                    </div>

                    {/* Section 4: Statutory Representative */}
                    <h2 className="section-title">Statutární zástupce</h2>
                    <div className="question-card">
                        <label className="question">Jméno statutárního zástupce</label>
                        <input
                            type="text"
                            onChange={e => {setNameStatuary(e.target.value)}}
                            required
                            placeholder="Josef Novák"
                            value={nameStatuary}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní telefon statutárního zástupce</label>
                        <input
                            type="tel"
                            onChange={e => {setPhoneStatutary(e.target.value)}}
                            required
                            placeholder="+420 777 777 777"
                            value={phoneStatutary}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní email statutárního zástupce</label>
                        <input
                            type="email"
                            onChange={e => {setEmailStatutary(e.target.value)}}
                            required
                            placeholder="pepa.novak@gmail.com"
                            value={emailStatutary}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Funkce statutárního zástupce</label>
                        <input
                            type="text"
                            onChange={e => {setFunctionStatutary(e.target.value)}}
                            required
                            placeholder="Funkce statutárního zástupce"
                            value={functionStatutary}
                        />
                    </div>

                    {/* Section 5: Legal Form */}
                    <h2 className="section-title">Právní forma</h2>
                    <div className="question-card">
                        <label className="question">Právní forma</label>
                        <Select
                            options={LEGAL_FORM_OPTIONS}
                            value={legalForm ? LEGAL_FORM_OPTIONS.find(opt => opt.value === legalForm) : null}
                            onChange={(selectedOption) => setLegalForm(selectedOption ? selectedOption.value : "")}
                            placeholder="Vyberte právní formu"
                            isClearable
                            required
                        />
                    </div>

                    {/* Section 6: Website */}
                    <h2 className="section-title">Webové stránky</h2>
                    <div className="question-card">
                        <label className="question">Vaše webové stránky</label>
                        <input
                            type="text"
                            onChange={e => {setWeb(e.target.value)}}
                            placeholder="Adresa vašich webových stránek"
                            value={web}
                        />
                    </div>

                    {/* Section 7: Registration Details */}
                    <h2 className="section-title">Registrační údaje</h2>
                    <div className="question-card">
                        <label className="question">Datum registrace v obchodním rejstříku nebo u živnostenského úřadu</label>
                        <input
                            type="date"
                            onChange={e => {setRegDate(e.target.value)}}
                            placeholder="Datum registrace"
                            required
                            value={regDate}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Místo registrace v obchodním rejstříku nebo u živnostenského úřadu</label>
                        <input
                            type="text"
                            onChange={e => {setRegPlace(e.target.value)}}
                            placeholder="Místo registrace"
                            required
                            value={regPlace}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Spisová značka</label>
                        <input
                            type="text"
                            onChange={e => {setMark(e.target.value)}}
                            placeholder="Spisová značka"
                            required
                            value={mark}
                        />
                    </div>

                    {/* Section 8: Meeting Representative */}
                    <h2 className="section-title">Zástupce pro jednání</h2>
                    <div className="question-card">
                        <label className="question">Jméno zástupce pro jednání</label>
                        <input
                            type="text"
                            onChange={e => {setNameMeeting(e.target.value)}}
                            required
                            placeholder="Josef Novák"
                            value={nameMeeting}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní telefon zástupce pro jednání</label>
                        <input
                            type="tel"
                            onChange={e => {setPhoneMeeting(e.target.value)}}
                            required
                            placeholder="+420 777 777 777"
                            value={phoneMeeting}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní email zástupce pro jednání</label>
                        <input
                            type="email"
                            onChange={e => {setEmailMeeting(e.target.value)}}
                            required
                            placeholder="pepa.novak@gmail.com"
                            value={emailMeeting}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Funkce zástupce pro jednání</label>
                        <input
                            type="text"
                            onChange={e => {setFunctionMeeting(e.target.value)}}
                            required
                            placeholder="Funkce zástupce pro jednání"
                            value={functionMeeting}
                        />
                    </div>

                    {/* Section 9: Business Information */}
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
                        <label><input type="radio" name="income" onChange={e => setIncome(e.target.value)} value="Do 1,5 mil" checked={income === "Do 1,5 mil"} /> Do 1,5 mil</label>
                        <label><input type="radio" name="income" onChange={e => setIncome(e.target.value)} value="1,5 - 18 miliónů" checked={income === "1,5 - 18 miliónů"} /> 1,5 - 18 miliónů</label>
                        <label><input type="radio" name="income" onChange={e => setIncome(e.target.value)} value="18 - 50 miliónů" checked={income === "18 - 50 miliónů"} /> 18 - 50 miliónů</label>
                        <label><input type="radio" name="income" onChange={e => setIncome(e.target.value)} value="50 - 100 miliónů" checked={income === "50 - 100 miliónů"} /> 50 - 100 miliónů</label>
                        <label><input type="radio" name="income" onChange={e => setIncome(e.target.value)} value="100 - 200 miliónů" checked={income === "100 - 200 miliónů"} /> 100 - 200 miliónů</label>
                        <label><input type="radio" name="income" onChange={e => setIncome(e.target.value)} value="200 miliónů - 1 miliarda" checked={income === "200 miliónů - 1 miliarda"} /> 200 miliónů - 1 miliarda</label>
                        <label><input type="radio" name="income" onChange={e => setIncome(e.target.value)} value="Více než 1 miliarda" checked={income === "Více než 1 miliarda"} /> Více než 1 miliarda</label>
                    </div>

                    <div className="question-card">
                        <label className="question">Import (Kč)</label>
                        <label><input type="radio" name="import" onChange={e => setImport(e.target.value)} value="Do 1,5 mil" checked={import_ === "Do 1,5 mil"} /> Do 1,5 mil</label>
                        <label><input type="radio" name="import" onChange={e => setImport(e.target.value)} value="1,5 - 18 miliónů" checked={import_ === "1,5 - 18 miliónů"} /> 1,5 - 18 miliónů</label>
                        <label><input type="radio" name="import" onChange={e => setImport(e.target.value)} value="18 - 50 miliónů" checked={import_ === "18 - 50 miliónů"} /> 18 - 50 miliónů</label>
                        <label><input type="radio" name="import" onChange={e => setImport(e.target.value)} value="50 - 100 miliónů" checked={import_ === "50 - 100 miliónů"} /> 50 - 100 miliónů</label>
                        <label><input type="radio" name="import" onChange={e => setImport(e.target.value)} value="100 - 300 miliónů" checked={import_ === "100 - 300 miliónů"} /> 100 - 300 miliónů</label>
                        <label><input type="radio" name="import" onChange={e => setImport(e.target.value)} value="300 miliónů - 1 miliarda" checked={import_ === "300 miliónů - 1 miliarda"} /> 300 miliónů - 1 miliarda</label>
                        <label><input type="radio" name="import" onChange={e => setImport(e.target.value)} value="Více než 1 miliarda" checked={import_ === "Více než 1 miliarda"} /> Více než 1 miliarda</label>
                    </div>

                    <div className="question-card">
                        <label className="question">Export (Kč)</label>
                        <label><input type="radio" name="export" onChange={e => setExport(e.target.value)} value="Do 1,5 mil" checked={export_ === "Do 1,5 mil"} /> Do 1,5 mil</label>
                        <label><input type="radio" name="export" onChange={e => setExport(e.target.value)} value="1,5 - 18 miliónů" checked={export_ === "1,5 - 18 miliónů"} /> 1,5 - 18 miliónů</label>
                        <label><input type="radio" name="export" onChange={e => setExport(e.target.value)} value="18 - 50 miliónů" checked={export_ === "18 - 50 miliónů"} /> 18 - 50 miliónů</label>
                        <label><input type="radio" name="export" onChange={e => setExport(e.target.value)} value="50 - 100 miliónů" checked={export_ === "50 - 100 miliónů"} /> 50 - 100 miliónů</label>
                        <label><input type="radio" name="export" onChange={e => setExport(e.target.value)} value="100 - 300 miliónů" checked={export_ === "100 - 300 miliónů"} /> 100 - 300 miliónů</label>
                        <label><input type="radio" name="export" onChange={e => setExport(e.target.value)} value="300 miliónů - 1 miliarda" checked={export_ === "300 miliónů - 1 miliarda"} /> 300 miliónů - 1 miliarda</label>
                        <label><input type="radio" name="export" onChange={e => setExport(e.target.value)} value="Více než 1 miliarda" checked={export_ === "Více než 1 miliarda"} /> Více než 1 miliarda</label>
                    </div>

                    {/* Section 10: Industry */}
                    <h2 className="section-title">Obor činnosti</h2>
                    <div className="question-card">
                        <label className="question">Převažující obor činnosti dle CZ-NACE</label>
                        <Select
                            isMulti
                            options={naceOptions}
                            value={industry}
                            onChange={setIndustry}
                            placeholder="Vyberte převažující obor činnosti"
                        />
                    </div>

                    {/* Section 11: Export Countries */}
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

                    {/* Section 12: Import Countries */}
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

                    {/* Section 13: Email Recipient */}
                    <h2 className="section-title">Emailová Adresa Příjemce</h2>
                    <div className="question-card">
                        <label className="question">Zadejte Emailovou adresu kam vám máme předvyplněnou přihlášku zaslat</label>
                        <input
                            type="email"
                            onChange={e => {setEmailTo(e.target.value)}}
                            required
                            placeholder="pepa.novak@gmail.com"
                            value={emailTo}
                        />
                    </div>

                    <div className="form-navigation">
                        <button
                            type="submit"
                            className="btn-submit"
                        >
                            Odeslat
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </>
  )
}

export default App
