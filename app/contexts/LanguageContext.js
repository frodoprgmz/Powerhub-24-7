import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translations = {
  pl: {
    // Auth
    login: 'Zaloguj się',
    register: 'Zarejestruj się',
    email: 'Adres email',
    password: 'Hasło',
    forgotPassword: 'Zapomniałeś hasła?',
    noAccount: 'Nie masz konta? Zarejestruj się',
    hasAccount: 'Masz już konto? Zaloguj się',
    createAccount: 'Utwórz konto',
    welcome: 'Witaj w Powerhub',
    loginError: 'Błąd logowania',
    regError: 'Błąd rejestracji',
    invalidEmail: 'Podaj prawidłowy adres email',
    passwordTooShort: 'Hasło musi mieć co najmniej 6 znaków',

    // Verify Email
    verifyEmailTitle: 'Weryfikacja Email',
    verifyEmailInfo: 'Wpisz 6-znakowy kod weryfikacyjny, który wysłaliśmy na adres:',
    verifySuccess: 'Twój email został pomyślnie zweryfikowany. Możesz się zalogować.',
    resendSuccess: 'Nowy kod został wysłany na Twój email.',
    resendError: 'Nie udało się wysłać nowego kodu.',
    enterCode: 'Podaj kod weryfikacyjny',
    verificationCodePlaceholder: 'Kod (np. A1B2C3)',
    resendNewCode: 'Wyślij nowy kod',
    sending: 'Wysyłanie...',

    // Forgot/Reset Password
    forgotPasswordTitle: 'Przywracanie Hasła',
    resetPasswordTitle: 'Resetowanie Hasła',
    sendResetCode: 'Wyślij kod',
    resetLinkSent: 'Kod resetujący został wysłany na Twój adres email.',
    resetSuccess: 'Hasło zostało zmienione. Możesz się teraz zalogować.',
    invalidCode: 'Błędny kod lub kod wygasł',
    enterEmail: 'Podaj adres email',
    codePlaceholder: 'Kod resetujący',
    newPassword: 'Nowe hasło',
    changePassword: 'Zmień hasło',

    // Main Screen
    yourPanel: 'Twój Panel',
    passStatus: 'Status Karnetu:',
    active: 'AKTYWNY',
    inactive: 'NIEAKTYWNY',
    expired: 'WYGASŁ',
    expiredOn: 'Wygasł:',
    passExpiredOffline: 'Karnet wygasł — połącz się z internetem aby odnowić',
    passExpiredOfflineHint: 'Twój karnet wygasł. Połącz się z internetem i kup nowy karnet, aby ponownie otworzyć drzwi.',
    validUntil: 'Ważny do:',
    needPass: 'Musisz posiadać aktywny karnet, aby otworzyć drzwi.',
    openDoor: 'Otwórz Drzwi',

    // Buy Pass Screen
    buyPass: 'Kup / Przedłuż Karnet',
    buyPassTitle: 'Kup Karnet',
    back: '← Wróć',
    testModeNote: 'Wybierz rodzaj karnetu. (Środowisko testowe – zakup zawsze kończy się sukcesem).',
    passDaily: 'Karnet 1-dniowy',
    passDailyPrice: '20 PLN',
    passDailyDesc: 'Ważny 24 godziny od momentu zakupu',
    passMonthly: 'Karnet 30-dniowy',
    passMonthlyPrice: '100 PLN',
    passMonthlyDesc: 'Najlepsza opcja! Ważny przez równe 30 dni.',
    paymentSuccess: 'Płatność zakończona! ',
    paymentErrorTitle: 'Błąd Płatności',
    paymentError: 'Wystąpił błąd',

    // Admin Panel
    adminPanel: 'Panel Administratora',
    logs: 'Wejścia',
    clients: 'Klienci',
    ekeys: 'eKeye',
    codes: 'Kody Offline',
    unlockTest: 'Otwórz Zamek (Test)',
    sendEkey: 'Wydaj eKey',
    generateCode: 'Wygeneruj Kod Offline',
    passcodeResult: 'Kod dostępu:',
    searchEmail: 'Szukaj po emailu...',
    searchClient: 'Szukaj klienta...',
    startDate: 'Data początkowa',
    endDate: 'Data końcowa',
    noLogs: 'Brak historii operacji.',
    noClients: 'Brak klientów.',
    refresh: 'Odśwież',
    saveChanges: 'Zapisz zmiany',
    editEkey: 'Edytuj',
    grantFromCalendar: 'Nadaj z Kalendarza',
    cancelPass: 'Anuluj Karnet',
    passUpdated: 'Zaktualizowano karnet',
    updateError: 'Błąd aktualizacji',
    lockDataError: 'Brak danych zamka. Spróbuj odświeżyć.',
    confirmCancelTitle: 'Potwierdzenie',
    confirmCancelMsg: 'Czy na pewno chcesz anulować karnet tego użytkownika?',
    yes: 'Tak',
    cancel: 'Anuluj',

    // Common
    logout: 'Wyloguj',
    langToggle: 'EN | English',
    success: 'Sukces',
    error: 'Błąd',
    loading: 'Ładowanie...',
    loadingPass: 'Sprawdzanie karnetu...',
    fetchError: 'Nie udało się załadować danych. Sprawdź połączenie z internetem.',
    retry: 'Spróbuj ponownie',
    offlineBanner: 'Brak internetu — wyświetlane dane z pamięci podręcznej',
    cachedData: 'Dane z ostatniej sesji online',
    offlineUnlockInfo: 'Otwarcie zamka przez Bluetooth działa bez internetu. Zakup karnetu wymaga połączenia.',
    somethingWentWrong: 'Coś poszło nie tak',
    fillAllFields: 'Wypełnij wszystkie pola',
    backToLogin: 'Wróć do logowania',
    dateRangeInvalid: 'Data końcowa musi być późniejsza niż data początkowa.',

    // Bluetooth / Lock errors
    ERR_PERMS: 'Brak uprawnień do Bluetooth/Lokalizacji',
    ERR_BT_OFF: 'Musisz włączyć Bluetooth, aby otworzyć zamek',
    ERR_TIMEOUT: 'Zbliż się do zamka i spróbuj ponownie',
    ERR_COMM: 'Błąd komunikacji z zamkiem',
  },
  en: {
    // Auth
    login: 'Login',
    register: 'Register',
    email: 'Email address',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    noAccount: 'No account? Register here',
    hasAccount: 'Already have an account? Login',
    createAccount: 'Create account',
    welcome: 'Welcome to Powerhub',
    loginError: 'Login error',
    regError: 'Registration error',
    invalidEmail: 'Enter a valid email address',
    passwordTooShort: 'Password must be at least 6 characters',

    // Verify Email
    verifyEmailTitle: 'Email Verification',
    verifyEmailInfo: 'Enter the 6-character verification code we sent to:',
    verifySuccess: 'Your email was successfully verified. You can log in.',
    resendSuccess: 'A new code has been sent to your email.',
    resendError: 'Failed to send a new code.',
    enterCode: 'Enter verification code',
    verificationCodePlaceholder: 'Code (e.g. A1B2C3)',
    resendNewCode: 'Resend new code',
    sending: 'Sending...',

    // Forgot/Reset Password
    forgotPasswordTitle: 'Password Recovery',
    resetPasswordTitle: 'Reset Password',
    sendResetCode: 'Send code',
    resetLinkSent: 'A reset code has been sent to your email address.',
    resetSuccess: 'Password changed. You can now log in.',
    invalidCode: 'Invalid or expired code',
    enterEmail: 'Enter email address',
    codePlaceholder: 'Reset code',
    newPassword: 'New password',
    changePassword: 'Change password',

    // Main Screen
    yourPanel: 'Your Dashboard',
    passStatus: 'Pass Status:',
    active: 'ACTIVE',
    inactive: 'INACTIVE',
    expired: 'EXPIRED',
    expiredOn: 'Expired:',
    passExpiredOffline: 'Pass expired — connect to internet to renew',
    passExpiredOfflineHint: 'Your pass has expired. Connect to the internet and buy a new pass to open the door again.',
    validUntil: 'Valid until:',
    needPass: 'You need an active pass to open the door.',
    openDoor: 'Open Door',

    // Buy Pass Screen
    buyPass: 'Buy / Extend Pass',
    buyPassTitle: 'Buy Pass',
    back: '← Back',
    testModeNote: 'Choose your pass type. (Test environment – purchase always succeeds).',
    passDaily: '1-Day Pass',
    passDailyPrice: '20 PLN',
    passDailyDesc: 'Valid for 24 hours from the moment of purchase',
    passMonthly: '30-Day Pass',
    passMonthlyPrice: '100 PLN',
    passMonthlyDesc: 'Best value! Valid for exactly 30 days.',
    paymentSuccess: 'Payment completed! ',
    paymentErrorTitle: 'Payment Error',
    paymentError: 'An error occurred',

    // Admin Panel
    adminPanel: 'Admin Panel',
    logs: 'Logs',
    clients: 'Clients',
    ekeys: 'eKeys',
    codes: 'Offline Codes',
    unlockTest: 'Open Lock (Test)',
    sendEkey: 'Send eKey',
    generateCode: 'Generate Offline Code',
    passcodeResult: 'Access Code:',
    searchEmail: 'Search by email...',
    searchClient: 'Search client...',
    startDate: 'Start date',
    endDate: 'End date',
    noLogs: 'No operation history.',
    noClients: 'No clients.',
    refresh: 'Refresh',
    saveChanges: 'Save changes',
    editEkey: 'Edit',
    grantFromCalendar: 'Grant from Calendar',
    cancelPass: 'Cancel Pass',
    passUpdated: 'Pass updated',
    updateError: 'Update error',
    lockDataError: 'No lock data. Try refreshing.',
    confirmCancelTitle: 'Confirmation',
    confirmCancelMsg: "Are you sure you want to cancel this user's pass?",
    yes: 'Yes',
    cancel: 'Cancel',

    // Common
    logout: 'Logout',
    langToggle: 'PL | Polski',
    success: 'Success',
    error: 'Error',
    loading: 'Loading...',
    loadingPass: 'Checking pass...',
    fetchError: 'Could not load data. Check your internet connection.',
    retry: 'Try again',
    offlineBanner: 'No internet connection — showing cached data',
    cachedData: 'Shown from cache (last online session)',
    offlineUnlockInfo: 'Bluetooth unlock is available offline. Buy pass requires internet.',
    somethingWentWrong: 'Something went wrong',
    fillAllFields: 'Fill in all fields',
    backToLogin: 'Back to login',
    dateRangeInvalid: 'End date must be after the start date.',

    // Bluetooth / Lock errors
    ERR_PERMS: 'Missing Bluetooth/Location permissions',
    ERR_BT_OFF: 'You must enable Bluetooth to open the lock',
    ERR_TIMEOUT: 'Get closer to the lock and try again',
    ERR_COMM: 'Lock communication error',
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('pl');

  useEffect(() => {
    AsyncStorage.getItem('lang').then((res) => {
      if (res) setLang(res);
    });
  }, []);

  const toggleLanguage = async () => {
    const newLang = lang === 'pl' ? 'en' : 'pl';
    setLang(newLang);
    await AsyncStorage.setItem('lang', newLang);
  };

  const t = (key) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
