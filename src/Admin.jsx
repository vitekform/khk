import { useState, useEffect } from 'react';

// Cookie helper functions
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

const setCookie = (name, value, days = 7) => {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
};

const deleteCookie = (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export default function Admin({ onGoBack }) {
    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    
    // Device verification state
    const [requiresVerification, setRequiresVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verifyError, setVerifyError] = useState('');
    
    // User info
    const [userInfo, setUserInfo] = useState(null);
    
    // Dashboard state
    const [activeTab, setActiveTab] = useState('ALL');
    const [applications, setApplications] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Form details state
    const [selectedApp, setSelectedApp] = useState(null);
    const [appDetails, setAppDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionSuccess, setActionSuccess] = useState('');

    // Generate unique device fingerprint
    const getFingerprint = () => {
        let fingerprint = localStorage.getItem('khk_fingerprint');
        if (!fingerprint) {
            fingerprint = 'khk_fg_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('khk_fingerprint', fingerprint);
        }
        return fingerprint;
    };

    // Check session on load
    useEffect(() => {
        const userId = getCookie('userId');
        const token = getCookie('token');
        if (userId && token) {
            checkSession(userId, token);
        } else {
            setAuthChecked(true);
        }
    }, []);

    const checkSession = async (userId, token) => {
        try {
            const response = await fetch(`/api/auth/me?userId=${userId}&token=${token}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.permLevel >= 3) {
                    setUserInfo(data);
                    setIsAuthenticated(true);
                } else {
                    setAuthError('K přístupu do administrace nemáte dostatečná oprávnění.');
                    handleLogout();
                }
            } else {
                handleLogout();
            }
        } catch (err) {
            console.error('Session check error:', err);
            handleLogout();
        } finally {
            setAuthChecked(true);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');
        
        try {
            const fingerprint = getFingerprint();
            const params = new URLSearchParams();
            params.append('emailOrUsername', usernameOrEmail);
            params.append('password', password);
            params.append('fingerprint', fingerprint);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params
            });

            const data = await response.json();

            if (typeof data === 'string' && data.startsWith('err:')) {
                setAuthError(formatErrorMsg(data));
            } else if (data.requiresVerification) {
                setRequiresVerification(true);
            } else if (data.token) {
                setCookie('userId', data.userId, 7);
                setCookie('token', data.token, 7);
                await checkSession(data.userId, data.token);
            } else {
                setAuthError('Přihlášení se nezdařilo. Zkontrolujte prosím své údaje.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setAuthError('Chyba komunikace se serverem.');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleVerifyDevice = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setVerifyError('');
        
        try {
            const fingerprint = getFingerprint();
            const params = new URLSearchParams();
            params.append('verificationCode', verificationCode);
            params.append('fingerprint', fingerprint);

            const response = await fetch('/api/auth/verify-device', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params
            });

            const data = await response.json();

            if (typeof data === 'string' && data.startsWith('err:')) {
                setVerifyError('Neplatný ověřovací kód.');
            } else if (data.token) {
                setCookie('userId', data.userId, 7);
                setCookie('token', data.token, 7);
                setRequiresVerification(false);
                await checkSession(data.userId, data.token);
            } else {
                setVerifyError('Ověření se nezdařilo.');
            }
        } catch (err) {
            console.error('Verification error:', err);
            setVerifyError('Chyba komunikace se serverem.');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        deleteCookie('userId');
        deleteCookie('token');
        setIsAuthenticated(false);
        setUserInfo(null);
        setSelectedApp(null);
        setAppDetails(null);
    };

    const formatErrorMsg = (errCode) => {
        switch(errCode) {
            case 'err:auth:user_not_found': return 'Uživatel s tímto jménem nebo e-mailem nebyl nalezen.';
            case 'err:auth:wrong_password': return 'Nesprávné heslo.';
            case 'err:auth:invalid_verification_code': return 'Neplatný ověřovací kód.';
            default: return `Chyba přihlášení: ${errCode}`;
        }
    };

    // Load applications list
    const fetchApplications = async () => {
        setLoadingList(true);
        try {
            const statusFilter = activeTab === 'ALL' ? '' : activeTab;
            const response = await fetch(`/api/khk/admin/list?status=${statusFilter}`);
            if (response.ok) {
                const data = await response.json();
                setApplications(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch applications');
            }
        } catch (err) {
            console.error('Error fetching applications:', err);
        } finally {
            setLoadingList(false);
        }
    };

    // Load details for an application
    const fetchAppDetails = async (app) => {
        setSelectedApp(app);
        setLoadingDetails(true);
        setAppDetails(null);
        setActionSuccess('');
        try {
            const response = await fetch(`/api/khk/admin/data?id=${app.id}`);
            if (response.ok) {
                const data = await response.json();
                setAppDetails(data);
            } else {
                console.error('Failed to fetch details');
            }
        } catch (err) {
            console.error('Error fetching details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Handle status updates
    const handleApprove = async () => {
        if (!selectedApp) return;
        setActionLoading(true);
        setActionSuccess('');
        try {
            const response = await fetch(`/api/khk/admin/accept?id=${selectedApp.id}`);
            const success = await response.json();
            if (success) {
                setActionSuccess('Žádost byla úspěšně schválena a data byla publikována.');
                // Refresh item status in locally tracked state
                setSelectedApp(prev => prev ? { ...prev, status: 'APPROVED' } : null);
                fetchApplications();
            } else {
                alert('Schválení selhalo. Zkontrolujte stav žádosti.');
            }
        } catch (err) {
            console.error('Error approving request:', err);
            alert('Chyba při schvalování.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSetStatus = async (status) => {
        if (!selectedApp) return;
        setActionLoading(true);
        setActionSuccess('');
        try {
            const response = await fetch(`/api/khk/admin/set_status?id=${selectedApp.id}&status=${status}`);
            const result = await response.text();
            if (result === 'OK') {
                setActionSuccess(`Stav žádosti byl úspěšně změněn na: ${status === 'REJECTED' ? 'Zamítnuto' : 'Rozpracováno'}`);
                setSelectedApp(prev => prev ? { ...prev, status: status } : null);
                fetchApplications();
            } else {
                alert('Změna stavu selhala.');
            }
        } catch (err) {
            console.error('Error setting status:', err);
            alert('Chyba při změně stavu.');
        } finally {
            setActionLoading(false);
        }
    };

    // Load applications when tab or authentication state changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchApplications();
        }
    }, [isAuthenticated, activeTab]);

    // Statistics counts
    const getStats = () => {
        const stats = { all: applications.length, pending: 0, approved: 0, rejected: 0 };
        applications.forEach(a => {
            if (a.status === 'PENDING') stats.pending++;
            if (a.status === 'APPROVED') stats.approved++;
            if (a.status === 'REJECTED') stats.rejected++;
        });
        // If we are currently displaying a filtered list, we still want the counts.
        // But since list is fetched matching filter, we only have counts of active status.
        // Thus, we fetch ALL initially, or count inside active if it is loaded.
        return stats;
    };

    const filteredApplications = applications.filter(app => {
        const matchText = searchQuery.toLowerCase();
        return (
            app.companyName?.toLowerCase().includes(matchText) ||
            app.email?.toLowerCase().includes(matchText) ||
            app.id?.toString().includes(matchText)
        );
    });

    if (!authChecked) {
        return (
            <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center font-sans">
                <div className="text-center space-y-4">
                    <div className="relative w-12 h-12 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                        <div className="absolute inset-0 rounded-full border-t-4 border-[#1565c0] animate-spin"></div>
                    </div>
                    <p className="text-slate-500 font-bold tracking-wide text-base">Ověřování přihlášení...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#f5f7fa] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
                <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
                    {/* Header */}
                    <div className="text-center">
                        <div className="inline-flex p-4 bg-blue-50 rounded-2xl border border-blue-100 text-[#1565c0] mb-6 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-extrabold text-[#1a202c] tracking-tight">KHK Administrace</h2>
                        <p className="mt-3 text-base text-slate-500 font-medium">
                            Pro přístup ke správě přihlášek se prosím přihlaste.
                        </p>
                    </div>

                    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                        <div className="bg-white py-8 px-6 shadow-sm border border-[#e0e4e8] rounded-xl sm:px-10">
                            {requiresVerification ? (
                                <form className="space-y-6" onSubmit={handleVerifyDevice}>
                                    <div className="admin-alert">
                                        <p className="font-bold text-amber-800 flex items-center gap-2 text-base">
                                            <svg className="h-5 w-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Nové zařízení detekováno
                                        </p>
                                        <p>Z bezpečnostních důvodů byl na váš e-mail zaslán ověřovací kód. Zadejte jej prosím níže.</p>
                                    </div>

                                    {verifyError && (
                                        <div className="admin-error">
                                            {verifyError}
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="verify-code" className="admin-label">
                                            Ověřovací kód
                                        </label>
                                        <input
                                            id="verify-code"
                                            name="verify-code"
                                            type="text"
                                            required
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            placeholder="Zadejte kód"
                                            className="admin-input"
                                        />
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={authLoading}
                                            className="admin-btn"
                                        >
                                            {authLoading ? 'Ověřování...' : 'Ověřit a pokračovat'}
                                        </button>
                                    </div>

                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={() => setRequiresVerification(false)}
                                            className="text-sm font-bold text-slate-500 hover:text-[#1565c0] transition-colors cursor-pointer"
                                        >
                                            Zpět na přihlášení
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form className="space-y-6" onSubmit={handleLogin}>
                                    {authError && (
                                        <div className="admin-error">
                                            {authError}
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="identity" className="admin-label">
                                            Uživatelské jméno nebo E-mail
                                        </label>
                                        <input
                                            id="identity"
                                            name="identity"
                                            type="text"
                                            required
                                            value={usernameOrEmail}
                                            onChange={(e) => setUsernameOrEmail(e.target.value)}
                                            placeholder="např. admin"
                                            className="admin-input"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="admin-label">
                                            Heslo
                                        </label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="admin-input"
                                        />
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={authLoading}
                                            className="admin-btn"
                                        >
                                            {authLoading ? 'Přihlašování...' : 'Přihlásit se'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-8 text-center">
                        <button 
                            onClick={onGoBack}
                            className="inline-flex items-center text-sm text-slate-500 hover:text-[#1565c0] font-bold transition-colors cursor-pointer gap-2"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Zpět na registrační formulář
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#f5f7fa] text-[#1a202c] font-sans flex flex-col antialiased overflow-hidden">
            {/* Navbar */}
            <header className="sticky top-0 z-40 bg-white border-b border-[#e0e4e8] px-8 py-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4">
                    <div>
                        <h1 className="text-xl font-bold text-[#1a202c] tracking-tight">KHK Administrace přihlášek</h1>
                        <p className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">Systém pro správu členských žádostí</p>
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    <button
                        onClick={onGoBack}
                        className="hidden md:inline-flex items-center px-5 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-bold text-[#1565c0] bg-white hover:bg-slate-50 active:scale-95 transition-all duration-200 cursor-pointer"
                    >
                        Formulář
                    </button>
                    <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-800">{userInfo?.username}</p>
                        <p className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">Administrátor</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all duration-200 cursor-pointer"
                    >
                        Odhlásit
                    </button>
                </div>
            </header>

            {/* Dashboard Container */}
            <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8 overflow-hidden">
                {/* Left Side: Forms List */}
                <div className="flex-1 flex flex-col space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Filtering tabs and Search */}
                    <div className="bg-white border border-[#e0e4e8] rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            {/* Search bar */}
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Hledat podle názvu firmy, IČO, e-mailu..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-5 py-3.5 bg-[#f8fafc] border border-[#cbd5e0] focus:border-[#1565c0] rounded-xl text-[#1a202c] text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100/50 transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex flex-wrap gap-2 pt-1.5 border-t border-slate-100">
                            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        setSelectedApp(null);
                                        setAppDetails(null);
                                    }}
                                    className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                                        activeTab === tab
                                            ? 'bg-[#1565c0] text-white shadow-md active:scale-95'
                                            : 'bg-[#f8fafc] border border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {tab === 'ALL' && 'Všechny'}
                                    {tab === 'PENDING' && 'Čekající'}
                                    {tab === 'APPROVED' && 'Schválené'}
                                    {tab === 'REJECTED' && 'Zamítnuté'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Applications List */}
                    {loadingList ? (
                        <div className="flex-1 flex items-center justify-center py-24 bg-white border border-[#e0e4e8] rounded-xl shadow-sm">
                            <div className="text-center space-y-3">
                                <div className="relative w-8 h-8 mx-auto">
                                    <div className="absolute inset-0 rounded-full border-2 border-slate-200"></div>
                                    <div className="absolute inset-0 rounded-full border-t-2 border-[#1565c0] animate-spin"></div>
                                </div>
                                <p className="text-slate-500 text-sm font-bold">Načítání seznamu...</p>
                            </div>
                        </div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white border border-[#e0e4e8] rounded-xl text-center px-6 shadow-sm">
                            <div className="p-4 bg-slate-50 border border-slate-150 text-slate-400 rounded-xl mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2m16 4h-2a2 2 0 00-2 2v1a2 2 0 002 2h2a2 2 0 002-2v-1a2 2 0 00-2-2z" />
                                </svg>
                            </div>
                            <p className="text-[#1a202c] font-bold text-lg">Žádné přihlášky k zobrazení</p>
                            <p className="text-slate-500 text-sm mt-2 max-w-[320px] mx-auto leading-relaxed font-medium">Nebyly nalezeny žádné přihlášky odpovídající vybraným kritériím.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3.5">
                            {filteredApplications.map((app) => (
                                <div
                                    key={app.id}
                                    onClick={() => fetchAppDetails(app)}
                                    className={`p-5 border rounded-2xl transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm ${
                                        selectedApp?.id === app.id
                                            ? 'bg-blue-50/30 border-[#1565c0] ring-1 ring-[#1565c0]/10'
                                            : 'bg-white border-[#e0e4e8] hover:border-slate-350 hover:bg-slate-50/50'
                                    }`}
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-[12px] font-mono font-bold text-slate-500 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg">
                                                ID: {app.id}
                                            </span>
                                            <span className="text-xs text-slate-500 font-bold">
                                                {app.submissionDate}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-[#1a202c]">{app.companyName}</h3>
                                        <p className="text-sm text-slate-500 flex items-center font-bold">
                                            <svg className="h-4.5 w-4.5 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            {app.email}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-4 sm:self-center">
                                        <span className={`px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-full border inline-flex items-center gap-1.5 ${
                                            app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                                            app.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-250' :
                                            'bg-amber-50 text-amber-700 border-amber-250'
                                        }`}>
                                            <span className={`h-2 w-2 rounded-full ${
                                                app.status === 'APPROVED' ? 'bg-emerald-500' :
                                                app.status === 'REJECTED' ? 'bg-red-500' :
                                                'bg-amber-500'
                                            }`}></span>
                                            {app.status === 'APPROVED' && 'Schváleno'}
                                            {app.status === 'REJECTED' && 'Zamítnuto'}
                                            {app.status === 'PENDING' && 'Čekající'}
                                        </span>
                                        <svg className="h-4.5 w-4.5 text-slate-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side: Details View */}
                <div className="w-full lg:w-1/2 xl:w-[600px] shrink-0 h-full">
                    <div className="bg-white border border-[#e0e4e8] rounded-xl p-6 h-full overflow-y-auto flex flex-col space-y-6 custom-scrollbar shadow-sm">
                        {!selectedApp ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400 my-auto">
                                <div className="p-4 bg-slate-50 border border-slate-150 text-slate-400 rounded-xl mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-[#1a202c] text-base">Detail přihlášky</h3>
                                <p className="text-sm text-slate-500 mt-2 max-w-[280px] leading-relaxed mx-auto">Vyberte přihlášku ze seznamu pro zobrazení všech vyplněných detailů a stažení PDF.</p>
                            </div>
                        ) : loadingDetails ? (
                            <div className="py-24 flex flex-col items-center justify-center space-y-3 my-auto">
                                <div className="relative w-8 h-8">
                                    <div className="absolute inset-0 rounded-full border-2 border-slate-200"></div>
                                    <div className="absolute inset-0 rounded-full border-t-2 border-[#1565c0] animate-spin"></div>
                                </div>
                                <p className="text-slate-500 text-sm font-bold">Načítání detailů...</p>
                            </div>
                        ) : !appDetails ? (
                            <div className="py-16 text-center text-red-600 font-bold text-sm my-auto">
                                Nepodařilo se načíst data přihlášky.
                            </div>
                        ) : (
                            <div className="space-y-6 text-[#1a202c]">
                                {/* Header Details */}
                                <div className="border-b border-slate-200 pb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase border inline-flex items-center gap-2 ${
                                            selectedApp.status === 'APPROVED' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                                            selectedApp.status === 'REJECTED' ? 'text-red-700 bg-red-50 border-red-200' :
                                            'text-amber-700 bg-amber-50 border-amber-200'
                                        }`}>
                                            <span className={`h-2 w-2 rounded-full ${
                                                selectedApp.status === 'APPROVED' ? 'bg-emerald-500' :
                                                selectedApp.status === 'REJECTED' ? 'bg-red-500' :
                                                'bg-amber-500'
                                            }`}></span>
                                            Stav: {selectedApp.status}
                                        </span>
                                        <span className="text-xs text-slate-500 font-bold">{selectedApp.submissionDate}</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1a202c] leading-tight">{appDetails.companyName}</h2>
                                    <p className="text-slate-500 text-sm mt-1.5 font-bold">{appDetails.email}</p>
                                </div>

                                {actionSuccess && (
                                    <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 text-sm rounded-xl font-bold leading-relaxed">
                                        {actionSuccess}
                                    </div>
                                )}

                                {/* Admin actions */}
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => window.open(`/api/khk/admin/pdf?id=${selectedApp.id}`, '_blank')}
                                        className="col-span-2 py-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 text-[#1565c0] rounded-xl text-sm font-bold flex items-center justify-center space-x-3 transition-all active:scale-[0.98] cursor-pointer shadow-sm"
                                    >
                                        <svg className="h-5 w-5 text-[#1565c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>Zobrazit / Stáhnout PDF</span>
                                    </button>

                                    {selectedApp.status === 'PENDING' && (
                                        <>
                                            <button
                                                disabled={actionLoading}
                                                onClick={handleApprove}
                                                className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
                                            >
                                                {actionLoading ? 'Schvalování...' : 'Schválit'}
                                            </button>
                                            <button
                                                disabled={actionLoading}
                                                onClick={() => handleSetStatus('REJECTED')}
                                                className="py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
                                            >
                                                {actionLoading ? 'Zpracování...' : 'Zamítnout'}
                                            </button>
                                        </>
                                    )}

                                    {selectedApp.status !== 'PENDING' && (
                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleSetStatus('PENDING')}
                                            className="col-span-2 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 text-slate-700 rounded-xl text-sm font-bold shadow-sm active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
                                        >
                                            {actionLoading ? 'Ukládání...' : 'Přesunout zpět do čekajících'}
                                        </button>
                                    )}
                                </div>

                                {/* Information Sections */}
                                <div className="space-y-6 text-sm">
                                    {/* Section 1: Firm & ID */}
                                    <div>
                                        <h3 className="text-[#1a202c] font-bold text-base border-b-3 border-[#ff6f00] inline-block pb-1 uppercase tracking-wider mb-3">
                                            Firma a identifikační údaje
                                        </h3>
                                        <div className="grid grid-cols-2 gap-x-5 gap-y-4 bg-slate-50/50 p-5 border border-[#e0e4e8] rounded-xl">
                                            <div>
                                                <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">IČO</p>
                                                <p className="text-slate-800 font-bold font-mono mt-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg inline-block text-sm">{appDetails.ic}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">DIČ</p>
                                                <p className="text-slate-800 font-bold font-mono mt-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg inline-block text-sm">{appDetails.dic || '-'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Právní forma</p>
                                                <p className="text-slate-800 font-bold mt-1 text-sm">{appDetails.legalForm || '-'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Sídlo</p>
                                                <p className="text-slate-850 mt-1 font-bold leading-relaxed text-sm">
                                                    {appDetails.streetAndNumber}, {appDetails.city}, {appDetails.postalCode}
                                                </p>
                                                {appDetails.region && <p className="text-[11px] text-slate-500 font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-lg mt-2 inline-block">Kraj: {appDetails.region}</p>}
                                            </div>
                                            {appDetails.lat && appDetails.lon && (
                                                <div className="col-span-2">
                                                    <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">GPS Souřadnice</p>
                                                    <p className="text-[#1565c0] font-mono mt-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg inline-block text-sm">{appDetails.lat}, {appDetails.lon}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 2: Contact Details */}
                                    <div>
                                        <h3 className="text-[#1a202c] font-bold text-base border-b-3 border-[#ff6f00] inline-block pb-1 uppercase tracking-wider mb-3">
                                            Kontaktní informace
                                        </h3>
                                        <div className="bg-slate-50/50 p-5 border border-[#e0e4e8] rounded-xl space-y-3">
                                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                                <span className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Telefon</span>
                                                <span className="text-slate-800 font-bold font-mono bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-sm">{appDetails.phone}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                                <span className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">E-mail</span>
                                                <span className="text-slate-800 font-bold text-sm">{appDetails.email}</span>
                                            </div>
                                            {appDetails.website && (
                                                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                                    <span className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Web</span>
                                                    <a href={appDetails.website.startsWith('http') ? appDetails.website : `https://${appDetails.website}`} target="_blank" rel="noreferrer" className="text-[#1565c0] hover:text-[#0d47a1] font-bold hover:underline text-sm">
                                                        {appDetails.website}
                                                    </a>
                                                </div>
                                            )}
                                            {appDetails.dataBoxId && (
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Datová schránka</span>
                                                    <span className="text-slate-800 font-bold font-mono bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-sm">{appDetails.dataBoxId}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 3: Statutory Representative */}
                                    <div>
                                        <h3 className="text-[#1a202c] font-bold text-base border-b-3 border-[#ff6f00] inline-block pb-1 uppercase tracking-wider mb-3">
                                            Statutární zástupce
                                        </h3>
                                        <div className="bg-slate-50/50 p-5 border border-[#e0e4e8] rounded-xl space-y-3.5">
                                            <div>
                                                <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Jméno</p>
                                                <p className="text-slate-800 font-bold mt-1 text-sm">{appDetails.statutoryRepresentative}</p>
                                            </div>
                                            {appDetails.statutoryRepresentativeRole && (
                                                <div className="border-t border-slate-200/50 pt-3">
                                                    <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Funkce</p>
                                                    <p className="text-slate-700 font-bold mt-1 text-sm">{appDetails.statutoryRepresentativeRole}</p>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/50">
                                                <div>
                                                    <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Telefon</p>
                                                    <p className="text-slate-850 font-bold font-mono mt-1 text-sm">{appDetails.statutoryRepresentativePhone || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">E-mail</p>
                                                    <p className="text-slate-850 font-bold mt-1 break-all text-sm">{appDetails.statutoryRepresentativeEmail || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 4: Meeting Representative */}
                                    {appDetails.communicationRepresentativeName && (
                                        <div>
                                            <h3 className="text-[#1a202c] font-bold text-base border-b-3 border-[#ff6f00] inline-block pb-1 uppercase tracking-wider mb-3">
                                                Zástupce pro komunikaci s KHK PK
                                            </h3>
                                            <div className="bg-slate-50/50 p-5 border border-[#e0e4e8] rounded-xl space-y-3.5">
                                                <div>
                                                    <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Jméno</p>
                                                    <p className="text-slate-800 font-bold mt-1 text-sm">{appDetails.communicationRepresentativeName}</p>
                                                </div>
                                                {appDetails.communicationRepresentativeRole && (
                                                    <div className="border-t border-slate-200/50 pt-3">
                                                        <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Funkce</p>
                                                        <p className="text-slate-700 font-bold mt-1 text-sm">{appDetails.communicationRepresentativeRole}</p>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/50">
                                                    <div>
                                                        <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Telefon</p>
                                                        <p className="text-slate-850 font-bold font-mono mt-1 text-sm">{appDetails.communicationRepresentativePhone || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">E-mail</p>
                                                        <p className="text-slate-850 font-bold mt-1 break-all text-sm">{appDetails.communicationRepresentativeEmail || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Section 5: Business operations */}
                                    <div>
                                        <h3 className="text-[#1a202c] font-bold text-base border-b-3 border-[#ff6f00] inline-block pb-1 uppercase tracking-wider mb-3">
                                            Podnikání a obrat
                                        </h3>
                                        <div className="grid grid-cols-2 gap-x-5 gap-y-4 bg-slate-50/50 p-5 border border-[#e0e4e8] rounded-xl">
                                            <div>
                                                <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Zaměstnanci</p>
                                                <p className="text-slate-800 font-bold mt-1 text-sm bg-white border border-slate-200 px-2.5 py-1 rounded-lg inline-block">{appDetails.employeeCount || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Čistý obrat (Kč)</p>
                                                <p className="text-slate-800 font-bold mt-1 text-sm bg-white border border-slate-200 px-2.5 py-1 rounded-lg inline-block">{appDetails.netTurnoverCzk || '-'}</p>
                                            </div>
                                            <div className="col-span-2 border-t border-slate-200/50 pt-3">
                                                <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Obor činnosti</p>
                                                <p className="text-slate-800 font-bold mt-1 text-sm leading-relaxed">{appDetails.fieldOfActivity || '-'}</p>
                                            </div>
                                            <div className="col-span-2 border-t border-slate-200/50 pt-3">
                                                <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">CZ-NACE</p>
                                                <p className="text-slate-800 font-bold mt-1 text-sm font-mono bg-white border border-slate-200 p-3 rounded-lg leading-relaxed">{appDetails.czNace || '-'}</p>
                                            </div>
                                            {appDetails.productsAndServicesSpecification && (
                                                <div className="col-span-2 border-t border-slate-200/50 pt-3">
                                                    <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px] mb-2">Specifikace produktů a služeb</p>
                                                    <p className="text-slate-700 bg-white p-4 rounded-xl border border-[#e0e4e8] whitespace-pre-wrap leading-relaxed font-bold text-sm">{appDetails.productsAndServicesSpecification}</p>
                                                </div>
                                            )}
                                            {appDetails.exportCountries && (
                                                <div className="col-span-2 border-t border-slate-200/50 pt-3">
                                                    <p className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Exportní země</p>
                                                    <p className="text-[#ff6f00] font-bold mt-1 text-sm">{appDetails.exportCountries}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 6: Additional mailing / billing */}
                                    <div>
                                        <h3 className="text-[#1a202c] font-bold text-base border-b-3 border-[#ff6f00] inline-block pb-1 uppercase tracking-wider mb-3">
                                            Faktury a mailing
                                        </h3>
                                        <div className="bg-slate-50/50 p-5 border border-[#e0e4e8] rounded-xl space-y-3">
                                            {appDetails.invoiceEmail && (
                                                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                                    <span className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Email pro faktury</span>
                                                    <span className="text-slate-800 font-bold text-sm">{appDetails.invoiceEmail}</span>
                                                </div>
                                            )}
                                            {appDetails.newsletterEmail && (
                                                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                                    <span className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Email pro newsletter</span>
                                                    <span className="text-slate-800 font-bold text-sm">{appDetails.newsletterEmail}</span>
                                                </div>
                                            )}
                                            {appDetails.monitorMailingInterest && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500 font-bold uppercase tracking-wide text-[11px]">Zasílání monitoru</span>
                                                    <span className="text-slate-800 font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-sm">{appDetails.monitorMailingInterest}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
