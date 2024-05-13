import React, { SyntheticEvent, useCallback, useMemo, useState } from 'react';
import { CredentialLoginBox, LoginBox, LoginInputBox, LoginPageContainer, SubmitButtonBox, ThirdPartyLoginBox, UserRegistrationLinkBox, Google, Microsoft, Meta, LinkedIn, GitHub } from './login.style';
import { Button, IconButton, InputAdornment, InputLabel, OutlinedInput, Tabs, Box, FormHelperText, Tab } from '@mui/material';
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link } from 'react-router-dom';

// Util Functions 
function validatePassword(password: string) {
    if(password) return '';
    return `'Password' is Required`;
}
function validateEmpty(value: string, label: string) {
    if(value) return '';
    return `'${label}' is Required`;
}

// Page Components
export function Login() {
    return (
        <LoginPageContainer>
            <LoginBox>
                <CredentialLogin/>
                <ThirdPartyLogin/>
                <UserRegistrationLink/>
            </LoginBox>
        </LoginPageContainer>
    );
}
function CredentialLogin() {
    const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);

    const tabs = useMemo(() => [{
        id: 'password',
        title: 'Password Login',
        component: <PasswordLogin />
    },{
        id: 'otp',
        title: 'OTP Login',
        component: <OtpLogin />
    }], []);

    const handleLoginModeChange = useCallback((event: SyntheticEvent, newValue: number) => {
        event.stopPropagation();
        setSelectedTabIndex(newValue);
    }, [setSelectedTabIndex]);

    const isTabActive = useCallback((tabIndex: number) => {
        return selectedTabIndex === tabIndex;
    }, [selectedTabIndex]);

    return (
        <CredentialLoginBox>
            <Box className="login-tab-box">
                <Tabs aria-label="Login Modes" variant="fullWidth" value={selectedTabIndex} onChange={handleLoginModeChange}>
                    {tabs.map((tab, index) => <Tab className="login-tab" key={`${tab.id}-tab-${index}`} label={tab.title} id={`${tab.id}-tab-${index}`} aria-controls={`${tab.id}-tabpanel-${index}`}/>)}
                </Tabs>
            </Box>
            {tabs.map((tab, index) => {
                return (
                    <div role="tabpanel" key={`${tab.id}-tabpanel-${index}`} id={`${tab.id}-tabpanel-${index}`} aria-labelledby={`${tab.id}-tab-${index}`}>
                        {isTabActive(index) && <Box className="login-tab-panel-box">{tab.component}</Box>}
                    </div>
                )
            })}
        </CredentialLoginBox>
    );
}
function PasswordLogin() {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');

    const handleClickSubmit = useCallback(() => {
        console.log(userId);
        console.log(password);
    }, [userId, password]);

    return (
        <Box>
            <TextField label="Email or Mobile" value={userId} setValue={setUserId}/>
            <PasswordField label="Password" setPassword={setPassword}/>
            <SubmitButtonBox>
                <Button variant="contained" size="large" color="success" onClick={handleClickSubmit}>
                    Submit
                </Button>
            </SubmitButtonBox>
        </Box>
    );
}
function TextField({label, value, setValue}: Readonly<{label: string, value?: string, setValue: (value: string) => void}>) {
    const [error, setError] = useState('');
    const hasError = useMemo(() => (typeof(error)==='string' && error.length>0), [error]);

    const onChangeHandler = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        event.stopPropagation();
        setValue(value);
        setError(validateEmpty(value, label));
    }, [label, setValue]);

    return (
        <LoginInputBox variant="outlined">
            <InputLabel htmlFor="text-field">{label}</InputLabel>
            <OutlinedInput
                id="text-field"
                type="text"
                label={label}
                value={value}
                required={true}
                onChange={onChangeHandler}
                error={hasError}
            />
            <FormHelperText error={hasError}>{error || ' '}</FormHelperText>
        </LoginInputBox>
    );
}
function PasswordField({label, setPassword}: Readonly<{label: string, setPassword: (value: string) => void}>) {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const hasError = useMemo(() => (typeof(error)==='string' && error.length>0), [error]);
    
    const handleClickShowPassword = useCallback(() => setShowPassword((show) => !show), []);
    const onChangePasswordHandler = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        event.stopPropagation();
        setPassword(value);
        setError(validatePassword(value));
    }, [setPassword]);

    return (
        <LoginInputBox variant="outlined">
            <InputLabel htmlFor="password-field">{label}</InputLabel>
            <OutlinedInput
                id="password-field"
                required={true}
                type={showPassword ? 'text' : 'password'}
                label={label}
                error={hasError}
                onChange={onChangePasswordHandler}
                endAdornment={
                    <InputAdornment position="end">
                        <IconButton
                            aria-label="Toggle Password Visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                        >
                            { showPassword ? <VisibilityOff/> : <Visibility/> }
                        </IconButton>
                    </InputAdornment>
                }
            />
            <FormHelperText error={hasError}>{error||' '}</FormHelperText>
        </LoginInputBox>
    );
}
function OtpLogin() {
    const [mobileNum, setMobileNum] = useState('');
    return (
        <Box>
            <MobileNumberField label="Mobile Number" value={mobileNum} setValue={setMobileNum}/>
        </Box>
    );
}
function MobileNumberField({label, value, setValue}: Readonly<{label: string, value?: string, setValue: (value: string) => void}>) {
    const [error, setError] = useState('');
    const hasError = useMemo(() => (typeof(error)==='string' && error.length>0), [error]);
    
    const onChangeHandler = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        event.stopPropagation();
        setValue(value);
        setError(validateEmpty(value, label));
    }, [label, setValue]);

    return (
        <LoginInputBox variant="outlined">
            <InputLabel htmlFor="text-field">{label}</InputLabel>
            <OutlinedInput
                id="text-field"
                type="number"
                label={label}
                value={value}
                required={true}
                error={hasError}
                onChange={onChangeHandler}
            />
            <FormHelperText error={hasError}>{error || ' '}</FormHelperText>
        </LoginInputBox>
    );
}
function ThirdPartyLogin() {
    return (
        <ThirdPartyLoginBox>
            <Google onClick={() => {console.log(`clicked Google`)}}/>
            <Microsoft onClick={() => {console.log(`clicked Microsoft`)}}/>
            <Meta onClick={() => {console.log(`clicked Facebook`)}}/>
            <LinkedIn onClick={() => {console.log(`clicked LinkedIn`)}}/>
            <GitHub onClick={() => {console.log(`clicked GitHub`)}}/>
        </ThirdPartyLoginBox>
    );
}
function UserRegistrationLink() {
    return (
        <UserRegistrationLinkBox>
            <p>Do not have account?</p>
            <Link to={'/register'}>Create an account</Link>
        </UserRegistrationLinkBox>
    );
}
