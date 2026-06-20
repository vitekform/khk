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
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center text-white space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
                    <p className="text-slate-400 font-medium">Ověřování přihlášení...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    {/* Header */}
                    <div className="text-center">
                        <div className="inline-flex p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500 mb-4 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">KHK Administrace</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Pro přístup ke správě přihlášek se prosím přihlaste.
                        </p>
                    </div>

                    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                        <div className="bg-slate-900/60 backdrop-blur-xl py-8 px-4 shadow-2xl rounded-3xl border border-slate-800 sm:px-10">
                            {requiresVerification ? (
                                <form className="space-y-6" onSubmit={handleVerifyDevice}>
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm rounded-xl space-y-2">
                                        <p className="font-semibold">Nové zařízení detekováno</p>
                                        <p>Z bezpečnostních důvodů byl na váš e-mail zaslán ověřovací kód. Zadejte jej prosím níže.</p>
                                    </div>

                                    {verifyError && (
                                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl font-medium">
                                            {verifyError}
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="verify-code" className="block text-sm font-semibold text-slate-300 mb-2">
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
                                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={authLoading}
                                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 transition-all cursor-pointer"
                                        >
                                            {authLoading ? 'Ověřování...' : 'Ověřit a pokračovat'}
                                        </button>
                                    </div>

                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={() => setRequiresVerification(false)}
                                            className="text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                                        >
                                            Zpět na přihlášení
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form className="space-y-6" onSubmit={handleLogin}>
                                    {authError && (
                                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl font-medium">
                                            {authError}
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="identity" className="block text-sm font-semibold text-slate-300 mb-2">
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
                                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
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
                                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={authLoading}
                                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 transition-all cursor-pointer"
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
                            className="inline-flex items-center text-sm text-slate-400 hover:text-white font-medium transition-colors cursor-pointer"
                        >
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Zpět na registrační formulář
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
            {/* Navbar */}
            <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-xl text-slate-950">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">KHK Administrace přihlášek</h1>
                        <p className="text-xs text-slate-400">Systém pro správu členských žádostí</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={onGoBack}
                        className="hidden md:inline-flex items-center px-4 py-2 border border-slate-800 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    >
                        Formulář
                    </button>
                    <div className="h-8 w-px bg-slate-800 hidden md:block"></div>
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-200">{userInfo?.username}</p>
                        <p className="text-xs text-slate-500">Admin panel</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-md shadow-rose-900/10 transition-all cursor-pointer"
                    >
                        Odhlásit
                    </button>
                </div>
            </header>

            {/* Dashboard Container */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
                {/* Left Side: Forms List */}
                <div className="flex-1 flex flex-col space-y-6">
                    {/* Filtering tabs and Search */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            {/* Search bar */}
                            <div className="relative flex-1">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Hledat podle názvu firmy, IČO, e-mailu..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                />
                            </div>
                            
                            <button
                                onClick={fetchApplications}
                                disabled={loadingList}
                                className="inline-flex items-center justify-center p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Obnovit seznam"
                            >
                                <svg className={`h-5 w-5 ${loadingList ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 19l-1.272-1.272" />
                                </svg>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
                            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        setSelectedApp(null);
                                        setAppDetails(null);
                                    }}
                                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                                        activeTab === tab
                                            ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
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
                        <div className="flex-1 flex items-center justify-center py-20 bg-slate-900/30 border border-slate-800/50 rounded-3xl">
                            <div className="text-center space-y-3">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
                                <p className="text-slate-400 text-sm">Načítání seznamu...</p>
                            </div>
                        </div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-800/50 rounded-3xl text-center px-4">
                            <div className="p-4 bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2m16 4h-2a2 2 0 00-2 2v1a2 2 0 002 2h2a2 2 0 002-2v-1a2 2 0 00-2-2z" />
                                </svg>
                            </div>
                            <p className="text-slate-300 font-semibold text-lg">Žádné přihlášky k zobrazení</p>
                            <p className="text-slate-500 text-sm mt-1">Nebyly nalezeny žádné přihlášky odpovídající vybraným kritériím.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredApplications.map((app) => (
                                <div
                                    key={app.id}
                                    onClick={() => fetchAppDetails(app)}
                                    className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                        selectedApp?.id === app.id
                                            ? 'bg-slate-800/80 border-amber-500/50 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/25'
                                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2.5">
                                            <span className="text-xs font-mono font-bold text-slate-500 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded">
                                                ID: {app.id}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {app.submissionDate}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-white">{app.companyName}</h3>
                                        <p className="text-sm text-slate-400 flex items-center">
                                            <svg className="h-4 w-4 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            {app.email}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-3 sm:self-center">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full tracking-wide inline-flex items-center ${
                                            app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            app.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                            'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                        }`}>
                                            {app.status === 'APPROVED' && 'Schváleno'}
                                            {app.status === 'REJECTED' && 'Zamítnuto'}
                                            {app.status === 'PENDING' && 'Čekající'}
                                        </span>
                                        <svg className="h-5 w-5 text-slate-500 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side: Details View */}
                <div className="w-full lg:w-[480px] shrink-0">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sticky top-24 max-h-[calc(100vh-140px)] overflow-y-auto flex flex-col space-y-6">
                        {!selectedApp ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                                <div className="p-4 bg-slate-950 border border-slate-800/60 text-slate-600 rounded-2xl mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-slate-300">Detail přihlášky</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-[240px]">Vyberte přihlášku ze seznamu pro zobrazení všech vyplněných detailů a stažení PDF.</p>
                            </div>
                        ) : loadingDetails ? (
                            <div className="py-20 flex flex-col items-center justify-center space-y-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
                                <p className="text-slate-400 text-sm">Načítání detailů...</p>
                            </div>
                        ) : !appDetails ? (
                            <div className="py-10 text-center text-rose-400">
                                Nepodařilo se načíst data přihlášky.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Header Details */}
                                <div className="border-b border-slate-800 pb-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded bg-slate-950 border border-slate-800 ${
                                            selectedApp.status === 'APPROVED' ? 'text-emerald-400' :
                                            selectedApp.status === 'REJECTED' ? 'text-rose-400' :
                                            'text-amber-400'
                                        }`}>
                                            STATUS: {selectedApp.status}
                                        </span>
                                        <span className="text-xs text-slate-500">{selectedApp.submissionDate}</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white leading-tight">{appDetails.companyName}</h2>
                                    <p className="text-slate-400 text-sm mt-1">{appDetails.email}</p>
                                </div>

                                {actionSuccess && (
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl font-medium">
                                        {actionSuccess}
                                    </div>
                                )}

                                {/* Admin actions */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => window.open(`/api/khk/admin/pdf?id=${selectedApp.id}`, '_blank')}
                                        className="col-span-2 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                                    >
                                        <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>Zobrazit / Stáhnout PDF</span>
                                    </button>

                                    {selectedApp.status === 'PENDING' && (
                                        <>
                                            <button
                                                disabled={actionLoading}
                                                onClick={handleApprove}
                                                className="py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-950/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                                            >
                                                {actionLoading ? 'Schvalování...' : 'Schválit'}
                                            </button>
                                            <button
                                                disabled={actionLoading}
                                                onClick={() => handleSetStatus('REJECTED')}
                                                className="py-3 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/30 hover:border-rose-500/50 text-rose-400 rounded-xl text-sm font-bold active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                                            >
                                                {actionLoading ? 'Zpracování...' : 'Zamítnout'}
                                            </button>
                                        </>
                                    )}

                                    {selectedApp.status !== 'PENDING' && (
                                        <button
                                            disabled={actionLoading}
                                            onClick={() => handleSetStatus('PENDING')}
                                            className="col-span-2 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-sm font-semibold active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                                        >
                                            {actionLoading ? 'Ukládání...' : 'Přesunout zpět do čekajících'}
                                        </button>
                                    )}
                                </div>

                                {/* Information Sections */}
                                <div className="space-y-5 text-sm">
                                    {/* Section 1: Firm & ID */}
                                    <div className="space-y-3 bg-slate-950/60 p-4 border border-slate-800/80 rounded-2xl">
                                        <h3 className="font-bold text-amber-500 text-xs tracking-wider uppercase">Firma a identifikační údaje</h3>
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <p className="text-slate-500 font-medium">IČO</p>
                                                <p className="text-white font-bold font-mono mt-0.5">{appDetails.ic}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 font-medium">DIČ</p>
                                                <p className="text-white font-bold font-mono mt-0.5">{appDetails.dic || '-'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-slate-500 font-medium">Právní forma</p>
                                                <p className="text-white mt-0.5">{appDetails.legalForm || '-'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-slate-500 font-medium">Sídlo</p>
                                                <p className="text-white mt-0.5">
                                                    {appDetails.streetAndNumber}, {appDetails.city}, {appDetails.postalCode}
                                                </p>
                                                {appDetails.region && <p className="text-slate-400 text-[10px] mt-0.5">Kraj: {appDetails.region}</p>}
                                            </div>
                                            {appDetails.lat && appDetails.lon && (
                                                <div className="col-span-2">
                                                    <p className="text-slate-500 font-medium">GPS Souřadnice</p>
                                                    <p className="text-white font-mono mt-0.5">{appDetails.lat}, {appDetails.lon}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 2: Contact Details */}
                                    <div className="space-y-3 bg-slate-950/60 p-4 border border-slate-800/80 rounded-2xl">
                                        <h3 className="font-bold text-amber-500 text-xs tracking-wider uppercase">Kontaktní informace</h3>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                                                <span className="text-slate-500">Telefon</span>
                                                <span className="text-white font-bold font-mono">{appDetails.phone}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                                                <span className="text-slate-500">E-mail</span>
                                                <span className="text-white font-bold">{appDetails.email}</span>
                                            </div>
                                            {appDetails.website && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500">Web</span>
                                                    <a href={appDetails.website.startsWith('http') ? appDetails.website : `https://${appDetails.website}`} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">
                                                        {appDetails.website}
                                                    </a>
                                                </div>
                                            )}
                                            {appDetails.dataBoxId && (
                                                <div className="flex items-center justify-between border-t border-slate-900 pt-1.5">
                                                    <span className="text-slate-500">Datová schránka</span>
                                                    <span className="text-white font-mono font-semibold">{appDetails.dataBoxId}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 3: Statutory Representative */}
                                    <div className="space-y-3 bg-slate-950/60 p-4 border border-slate-800/80 rounded-2xl">
                                        <h3 className="font-bold text-amber-500 text-xs tracking-wider uppercase">Statutární zástupce</h3>
                                        <div className="space-y-2 text-xs">
                                            <div>
                                                <p className="text-slate-500 font-medium">Jméno</p>
                                                <p className="text-white font-semibold mt-0.5">{appDetails.statutoryRepresentative}</p>
                                            </div>
                                            {appDetails.statutoryRepresentativeRole && (
                                                <div>
                                                    <p className="text-slate-500 font-medium">Funkce</p>
                                                    <p className="text-slate-300 mt-0.5">{appDetails.statutoryRepresentativeRole}</p>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-900">
                                                <div>
                                                    <p className="text-slate-500 font-medium">Telefon</p>
                                                    <p className="text-white font-mono mt-0.5">{appDetails.statutoryRepresentativePhone || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 font-medium">E-mail</p>
                                                    <p className="text-white mt-0.5 break-all">{appDetails.statutoryRepresentativeEmail || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 4: Meeting Representative */}
                                    {appDetails.communicationRepresentativeName && (
                                        <div className="space-y-3 bg-slate-950/60 p-4 border border-slate-800/80 rounded-2xl">
                                            <h3 className="font-bold text-amber-500 text-xs tracking-wider uppercase">Zástupce pro komunikaci s KHK PK</h3>
                                            <div className="space-y-2 text-xs">
                                                <div>
                                                    <p className="text-slate-500 font-medium">Jméno</p>
                                                    <p className="text-white font-semibold mt-0.5">{appDetails.communicationRepresentativeName}</p>
                                                </div>
                                                {appDetails.communicationRepresentativeRole && (
                                                    <div>
                                                        <p className="text-slate-500 font-medium">Funkce</p>
                                                        <p className="text-slate-300 mt-0.5">{appDetails.communicationRepresentativeRole}</p>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-900">
                                                    <div>
                                                        <p className="text-slate-500 font-medium">Telefon</p>
                                                        <p className="text-white font-mono mt-0.5">{appDetails.communicationRepresentativePhone || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500 font-medium">E-mail</p>
                                                        <p className="text-white mt-0.5 break-all">{appDetails.communicationRepresentativeEmail || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Section 5: Business operations */}
                                    <div className="space-y-3 bg-slate-950/60 p-4 border border-slate-800/80 rounded-2xl">
                                        <h3 className="font-bold text-amber-500 text-xs tracking-wider uppercase">Podnikání a obrat</h3>
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <p className="text-slate-500 font-medium">Počet zaměstnanců</p>
                                                <p className="text-white font-semibold mt-0.5">{appDetails.employeeCount || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 font-medium">Čistý obrat (Kč)</p>
                                                <p className="text-white font-semibold mt-0.5">{appDetails.netTurnoverCzk || '-'}</p>
                                            </div>
                                            <div className="col-span-2 border-t border-slate-900 pt-1.5">
                                                <p className="text-slate-500 font-medium">Obor činnosti</p>
                                                <p className="text-white mt-0.5">{appDetails.fieldOfActivity || '-'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-slate-500 font-medium">Převažující obor činnosti (CZ-NACE)</p>
                                                <p className="text-white mt-0.5">{appDetails.czNace || '-'}</p>
                                            </div>
                                            {appDetails.productsAndServicesSpecification && (
                                                <div className="col-span-2">
                                                    <p className="text-slate-500 font-medium font-semibold">Specifikace produktů a služeb</p>
                                                    <p className="text-slate-300 mt-1 bg-slate-900 p-2.5 rounded-xl border border-slate-800/50 whitespace-pre-wrap">{appDetails.productsAndServicesSpecification}</p>
                                                </div>
                                            )}
                                            {appDetails.exportCountries && (
                                                <div className="col-span-2 border-t border-slate-900 pt-1.5">
                                                    <p className="text-slate-500 font-medium">Exportní země</p>
                                                    <p className="text-amber-200 mt-0.5 font-medium">{appDetails.exportCountries}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 6: Additional mailing / billing */}
                                    <div className="space-y-3 bg-slate-950/60 p-4 border border-slate-800/80 rounded-2xl">
                                        <h3 className="font-bold text-amber-500 text-xs tracking-wider uppercase">Faktury a mailing</h3>
                                        <div className="space-y-2 text-xs">
                                            {appDetails.invoiceEmail && (
                                                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                                                    <span className="text-slate-500">Email pro faktury</span>
                                                    <span className="text-white font-semibold">{appDetails.invoiceEmail}</span>
                                                </div>
                                            )}
                                            {appDetails.newsletterEmail && (
                                                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                                                    <span className="text-slate-500">Email pro newsletter</span>
                                                    <span className="text-white font-semibold">{appDetails.newsletterEmail}</span>
                                                </div>
                                            )}
                                            {appDetails.monitorMailingInterest && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500">Zasílání monitoru</span>
                                                    <span className="text-white font-semibold">{appDetails.monitorMailingInterest}</span>
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
