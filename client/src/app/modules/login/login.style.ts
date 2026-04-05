import { styled, FormControl, Box, Paper } from '@mui/material';
import { JSX, type SVGProps } from 'react';
import { GoogleIcon, MicrosoftIcon, MetaIcon, LinkedInIcon, GitHubIcon } from "../../icons";

function styledThirdPartyIcon(children: (props: SVGProps<SVGSVGElement>) => JSX.Element) {
    return styled(children)`
        height: 100%;
        width: auto;
        aspect-ratio: 1;
        cursor: pointer;
        &:hover {
            &>path {
                fill: #2e7d32;
            }
        }
    `;
}

export const Google = styledThirdPartyIcon(GoogleIcon);
export const Microsoft = styledThirdPartyIcon(MicrosoftIcon);
export const Meta = styledThirdPartyIcon(MetaIcon);
export const LinkedIn = styledThirdPartyIcon(LinkedInIcon);
export const GitHub = styledThirdPartyIcon(GitHubIcon);

export const LoginPageContainer = styled(Box)`
    width: 100vw;
    height: 100vh;
    background-color: #82c0cc;
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

export const LoginBox = styled(Paper)`
    width: 23vw;
    height: 70vh;
    max-width: 100%;
    max-height: 100%;
    overflow: 'none';
    margin-right: 8%;
    background-color: #cfdbde;
    display: flex;
    flex-direction: column;
`;

export const CredentialLoginBox = styled(Box)`
    height: 75%;
    & .login-tab-box {
        border-bottom: 1px;
        border-color: divider;
        & .login-tab {
            height: 60px;
        }
    }
    & .login-tab-panel-box {
        padding: 6% 4%;
    }
`;

export const ThirdPartyLoginBox = styled(Box, {skipSx: true})`
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    height: 10%;
    padding: 4%;
`;

export const UserRegistrationLinkBox = styled(Box)`
    height: 15%;
    text-align: center;
    padding: 2% 10% 10% 10%;
`;

export const LoginInputBox = styled(FormControl)`
    width: 92%;
    margin: 4%;
    border-radius: 5px;
`;

export const SubmitButtonBox = styled(Box)`
    width: 92%;
    margin: 4% auto;
    display: flex;
    justify-content: flex-end;
`;
