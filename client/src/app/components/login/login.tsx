import React, { useCallback, useState } from "react";
import {styled, AppBar, Toolbar, Box, Dialog, FormControl, InputLabel, FilledInput, InputAdornment, IconButton, OutlinedInput, Button} from '@mui/material';
import { Visibility, VisibilityOff,  } from '@mui/icons-material';

const StyledBox = styled(Box)`
    height: 100vh;
    background-color: #DCDCDC;
`;

const Header = styled(AppBar)`
    height: 200px;
    background-color: #00BFA5;
    box-shadow: none;
`;

const InputBox = styled(FormControl)`
    width: 92%;
    margin: 4%;
`;

function TextField({label="Email or Mobile", value, setValue}: Readonly<{label: string, value?: string, setValue: (value: string) => void}>) {
    return (
        <InputBox variant="outlined">
            <InputLabel htmlFor="text-field">{label}</InputLabel>
            <OutlinedInput
                id="text-field"
                type="text"
                label={label}
                value={value}
                required={true}
                onChange={(e) => setValue(e.target.value)}
            />
        </InputBox>
    );
}

function isValidPassword(password: string) {
    if(password) return true;
}

function PasswordField({label="Password", setPassword}: Readonly<{label: string, setPassword: (value: string) => void}>) {
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    const handleClickShowPassword = useCallback(() => setShowPassword((show) => !show), []);
    const onChangePasswordHandler = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        const isValidPass = isValidPassword(value);
        if(isValidPass) setPassword(value);
        else setErrorMessage('Password is Required.')
    }, []);

    return (
        <InputBox variant="outlined">
            <InputLabel htmlFor="password-field">{label}</InputLabel>
            <OutlinedInput
                id="password-field"
                required={true}
                type={showPassword ? 'text' : 'password'}
                label={label}
                onChange={onChangePasswordHandler}
                endAdornment={
                    <InputAdornment position="end">
                        <IconButton
                            aria-label="Toggle Password Visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                        >
                            { showPassword ? <VisibilityOff /> : <Visibility /> }
                        </IconButton>
                    </InputAdornment>
                }
            />
        </InputBox>
    );
}

export function Login() {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');

    const handleClickSubmit = useCallback(() => {
        console.log(userId);
        console.log(password);
    }, [userId, password]);

    return (
        <StyledBox>
            <Header>
                <Toolbar></Toolbar>
            </Header>
            <Dialog open={true} hideBackdrop={true} PaperProps={{
                sx: {
                    height: '95%',
                    marginTop: '10%',
                    marginLeft: '60%',
                    width: '30%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    overflow: 'none',
                    padding: '2%'
                }
            }}>
                <TextField label="Email or Mobile" setValue={setUserId}/>
                <PasswordField label="Password" setPassword={setPassword}/>
                <Box sx={{width: '92%', margin: '4%', display: 'flex', justifyContent: 'flex-end'}}>
                    <Button variant="contained" size="large" color="success" onClick={handleClickSubmit}>
                        Submit
                    </Button>
                </Box>
            </Dialog>
        </StyledBox>
    );
}