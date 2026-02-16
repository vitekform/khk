import { useState } from 'react'
import './App.css'
import countryList from "react-select-country-list";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
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
    const [showCorrespondenceAddress, setShowCorrespondenceAddress] = useState(false)
    const [corrStreet, setCorrStreet] = useState("")
    const [corrCity, setCorrCity] = useState("")
    const [corrZip, setCorrZip] = useState("")
    const [corrState, setCorrState] = useState("")
    const [industryDescription, setIndustryDescription] = useState("")
    const [newsletterEmail, setNewsletterEmail] = useState("")
    const [invoiceEmail, setInvoiceEmail] = useState("")
    const [monitorDaily, setMonitorDaily] = useState(false)
    const [monitorWeekly, setMonitorWeekly] = useState(false)
    const [monitorMonthly, setMonitorMonthly] = useState(false)
    const [dataBoxId, setDataBoxId] = useState("")
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
            !functionStatutary || !legalForm || !regDate || !mark ||
            !nameMeeting || !phoneMeeting || !emailMeeting || !functionMeeting || 
            industry.length === 0) {
            alert("Prosím vyplňte všechna povinná pole!");
            return;
        }
        
        // Create JSON with all data
        const submissionDate = new Date().toISOString().split('T')[0];
        const data = {
            "Datum podání": submissionDate,
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
            "Spisová značka": mark,
            "Zástupce pro komunikaci s KHK PK": nameMeeting,
            "Telefon zástupce pro komunikaci": phoneMeeting,
            "Email zástupce pro komunikaci": emailMeeting,
            "Funkce zástupce pro komunikaci": functionMeeting,
            "ID datové schránky": dataBoxId,
            "Množství zaměstanců": employeeNum,
            "Čistý obrat (Kč)": income,
            "Import (Kč)": import_,
            "Export (Kč)": export_,
            "Převažující obor činnosti dle CZ-NACE": industry.map(i => i.label).join(', '),
            "Specifikace produktů a služeb": industryDescription,
            "Země, kam exportujete/chcete exportovat": exportCountries.map(c => c.label).join(', '),
            "Země, odkud importujete/chcete importovat": importCountries.map(c => c.label).join(', '),
            "Korespondenční adresa - Ulice": corrStreet,
            "Korespondenční adresa - Město": corrCity,
            "Korespondenční adresa - PSČ": corrZip,
            "Korespondenční adresa - Kraj": corrState,
            "Email pro newsletter": newsletterEmail,
            "Email pro faktury": invoiceEmail,
            "Monitor - denně": monitorDaily ? "ANO" : "NE",
            "Monitor - týdně": monitorWeekly ? "ANO" : "NE",
            "Monitor - měsíčně": monitorMonthly ? "ANO" : "NE"
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
                    <div className="question-card">
                        <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', marginBottom: '8px'}}>
                            <input 
                                type="checkbox" 
                                checked={showCorrespondenceAddress}
                                onChange={e => setShowCorrespondenceAddress(e.target.checked)}
                                style={{marginRight: '8px', width: 'auto'}}
                            />
                            Vyplnit korespondenční adresu
                        </label>
                        <p style={{fontSize: '13px', color: '#78909c', marginTop: '4px'}}>
                            Pokud se liší od sídla společnosti.
                        </p>
                        {showCorrespondenceAddress && (
                            <div style={{marginTop: '16px'}}>
                                <div style={{marginBottom: '12px'}}>
                                    <label className="question" style={{fontSize: '14px', marginBottom: '8px'}}>Ulice a číslo</label>
                                    <input
                                        type="text"
                                        onChange={e => {setCorrStreet(e.target.value)}}
                                        placeholder="Ulice a číslo"
                                        value={corrStreet}
                                    />
                                </div>
                                <div style={{marginBottom: '12px'}}>
                                    <label className="question" style={{fontSize: '14px', marginBottom: '8px'}}>Obec</label>
                                    <input
                                        type="text"
                                        onChange={e => {setCorrCity(e.target.value)}}
                                        placeholder="Obec"
                                        value={corrCity}
                                    />
                                </div>
                                <div style={{marginBottom: '12px'}}>
                                    <label className="question" style={{fontSize: '14px', marginBottom: '8px'}}>PSČ</label>
                                    <input
                                        type="text"
                                        onChange={e => {setCorrZip(e.target.value)}}
                                        placeholder="PSČ"
                                        value={corrZip}
                                    />
                                </div>
                                <div>
                                    <label className="question" style={{fontSize: '14px', marginBottom: '8px'}}>Kraj</label>
                                    <input
                                        type="text"
                                        onChange={e => {setCorrState(e.target.value)}}
                                        placeholder="Kraj"
                                        value={corrState}
                                    />
                                </div>
                            </div>
                        )}
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
                        <label className="question">Datum založení</label>
                        <input
                            type="date"
                            onChange={e => {setRegDate(e.target.value)}}
                            placeholder="Datum založení"
                            required
                            value={regDate}
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
                    <h2 className="section-title">Zástupce pro komunikaci s KHK PK</h2>
                    <div className="question-card">
                        <label className="question">Jméno zástupce pro komunikaci s KHK PK</label>
                        <input
                            type="text"
                            onChange={e => {setNameMeeting(e.target.value)}}
                            required
                            placeholder="Josef Novák"
                            value={nameMeeting}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní telefon zástupce</label>
                        <input
                            type="tel"
                            onChange={e => {setPhoneMeeting(e.target.value)}}
                            required
                            placeholder="+420 777 777 777"
                            value={phoneMeeting}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Kontaktní email zástupce</label>
                        <input
                            type="email"
                            onChange={e => {setEmailMeeting(e.target.value)}}
                            required
                            placeholder="pepa.novak@gmail.com"
                            value={emailMeeting}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Funkce zástupce</label>
                        <input
                            type="text"
                            onChange={e => {setFunctionMeeting(e.target.value)}}
                            required
                            placeholder="Funkce zástupce"
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
                        <CreatableSelect
                            isMulti
                            options={naceOptions}
                            value={industry}
                            onChange={setIndustry}
                            placeholder="Vyberte převažující obor činnosti"
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Specifikace produktů a služeb (volitelné)</label>
                        <p style={{fontSize: '13px', color: '#78909c', marginTop: '-8px', marginBottom: '12px'}}>
                            Jasně specifikujte produkty a služby, které poskytujete (maximálně 600 znaků)
                        </p>
                        <textarea
                            onChange={e => {setIndustryDescription(e.target.value)}}
                            placeholder="Popište vaše produkty a služby..."
                            value={industryDescription}
                            maxLength="600"
                            rows="4"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                fontSize: '15px',
                                border: '1px solid #cbd5e0',
                                borderRadius: '6px',
                                background: '#f8fafc',
                                outline: 'none',
                                color: '#1a202c',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                                resize: 'vertical'
                            }}
                        />
                        <div style={{fontSize: '12px', color: '#94a3b8', marginTop: '4px', textAlign: 'right'}}>
                            {industryDescription.length}/600 znaků
                        </div>
                    </div>

                    {/* Section 10a: Data Box ID */}
                    <h2 className="section-title">Datová schránka</h2>
                    <div className="question-card">
                        <label className="question">ID datové schránky (volitelné)</label>
                        <input
                            type="text"
                            onChange={e => {setDataBoxId(e.target.value)}}
                            placeholder="ID datové schránky"
                            value={dataBoxId}
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
                        <label className="question">Uveďte země, odkud importujete/chcete importovat</label>
                        <Select
                            isMulti
                            options={countryOptions}
                            value={importCountries}
                            onChange={setImportCountries}
                            placeholder="Začněte psát název země..."
                        />
                    </div>

                    {/* Section 13: Additional Information */}
                    <h2 className="section-title">Dodatečné informace</h2>
                    <div className="question-card">
                        <label className="question">Email pro zasílání informací (newsletter, týdenní/měsíční bulletin)</label>
                        <input
                            type="email"
                            onChange={e => {setNewsletterEmail(e.target.value)}}
                            placeholder="email@example.com"
                            value={newsletterEmail}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Email pro zasílání faktur za členský příspěvek</label>
                        <input
                            type="email"
                            onChange={e => {setInvoiceEmail(e.target.value)}}
                            placeholder="email@example.com"
                            value={invoiceEmail}
                        />
                    </div>
                    <div className="question-card">
                        <label className="question">Požadavek na zasílání monitoru</label>
                        <label style={{display: 'flex', alignItems: 'center', padding: '8px 0'}}>
                            <input 
                                type="checkbox" 
                                checked={monitorDaily}
                                onChange={e => setMonitorDaily(e.target.checked)}
                                style={{marginRight: '8px', width: 'auto'}}
                            />
                            Denně
                        </label>
                        <label style={{display: 'flex', alignItems: 'center', padding: '8px 0'}}>
                            <input 
                                type="checkbox" 
                                checked={monitorWeekly}
                                onChange={e => setMonitorWeekly(e.target.checked)}
                                style={{marginRight: '8px', width: 'auto'}}
                            />
                            Týdně
                        </label>
                        <label style={{display: 'flex', alignItems: 'center', padding: '8px 0'}}>
                            <input 
                                type="checkbox" 
                                checked={monitorMonthly}
                                onChange={e => setMonitorMonthly(e.target.checked)}
                                style={{marginRight: '8px', width: 'auto'}}
                            />
                            Měsíčně
                        </label>
                    </div>

                    {/* Section 14: Consent Texts */}
                    <h2 className="section-title">Souhlas a prohlášení</h2>
                    <div className="question-card">
                        <p style={{fontSize: '15px', lineHeight: '1.6', color: '#37474f', marginBottom: '16px'}}>
                            Žadatel souhlasí se zpracováním osobních údajů.
                        </p>
                        <p style={{fontSize: '15px', lineHeight: '1.6', color: '#37474f', margin: '0'}}>
                            Žadatel prohlašuje, že je členem Hospodářské komory České republiky a zavazuje se plnit členské povinnosti, 
                            hradit členské příspěvky a dodržovat obchodní etiku a integritu.
                        </p>
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
