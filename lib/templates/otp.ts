/**
 * OTP Email Template
 * Professional HTML email template for sending One-Time Password
 * Matches the styling and branding from databox-enrich-api-server
 */

export function otpHTML(otp: string): string {
  return `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title></title>

    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <style type="text/css">
        /* FONTS */
        @media screen {
            @font-face {
                font-family: 'Lato';
                font-style: normal;
                font-weight: 400;
                src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
            }

            @font-face {
                font-family: 'Lato';
                font-style: normal;
                font-weight: 700;
                src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
            }

            @font-face {
                font-family: 'Lato';
                font-style: italic;
                font-weight: 400;
                src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
            }

            @font-face {
                font-family: 'Lato';
                font-style: italic;
                font-weight: 700;
                src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format('woff');
            }
        }

        /* CLIENT-SPECIFIC STYLES */
        body, table, td, a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }

        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }

        img {
            -ms-interpolation-mode: bicubic;
        }

        /* RESET STYLES */
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }

        table {
            border-collapse: collapse !important;
        }

        body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
        }

        /* iOS BLUE LINKS */
        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }

        /* MOBILE STYLES */
        @media screen and (max-width: 600px) {
            h1 {
                font-size: 32px !important;
                line-height: 32px !important;
            }
        }

        /* ANDROID CENTER FIX */
        div[style*="margin: 16px 0;"] {
            margin: 0 !important;
        }



    </style>
</head>
<body style="margin: 0 !important; padding: 0 !important;">

<table class="m_-1937955048528333929gmail-fix" style="background:#fff;min-width:320px" width="100%" cellspacing="0"
       cellpadding="0">
    <tbody>
    <tr>
        <td>
            <table class="m_-1937955048528333929w-100p"
                   style="max-width:650px;margin:0 auto;background-color:#ffffff;border-spacing:0" width="650"
                   cellspacing="0" cellpadding="0" border="0" align="center">
                <tbody>
                <tr>
                    <td class="m_-1937955048528333929plr-25" style="padding:28px 24px 10px">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
                            <tbody>
                            <tr>
                                <td class="m_-1937955048528333929pb-24" style="padding:0 0 24px" align="center">
                                    <a style="text-decoration:none"
                                       href="https://www.enrich.so"
                                       target="_blank"
                                       >
                                        <img src="https://enrich.so/logo_email_v1.png"
                                             style="width:205px;max-width:205px;font-size:10px;font-family:'Whyte',Arial,Helvetica,sans-serif;line-height:14px;background-color:#ffffff;color:#000000;vertical-align:top;text-align:center"
                                             alt="Enrich.so" class="CToWUd" width="65"></a></td>
                            </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>


                <tr>
                    <td>
                        <table class="m_-1937955048528333929w-100p" style="max-width:476px;margin:0 auto" width="500"
                               cellspacing="0" cellpadding="0" align="center">
                            <tbody>
                            <tr>
                                <td class="m_-1937955048528333929pb-42"
                                    style="font-size:16px;line-height:32px;font-weight:normal;font-family:'Whyte',Arial,Helvetica,sans-serif;color:#000;padding:10px 37px 32px;"
                                    align="">
                                    <strong>Hello !</strong><br> We have received a login request for your
                                    account at Enrich.so<br/>
                                    You can login into your account by entering the One time login access code below.
                                </td>
                            </tr>
                            </tbody>
                        </table>

                        <table class="m_-1937955048528333929w-100p" style="max-width:476px;margin:0 auto" width="476"
                               cellspacing="0" cellpadding="0" align="center">
                            <tbody>
                            <tr>
                                <td class="m_-1937955048528333929pb-60" style="padding:20px 0 60px" align="center">
                                    <table style="margin:0 auto" cellspacing="0" cellpadding="0" align="center">
                                        <tbody>
                                        <tr>
                                            <td class="m_-1937955048528333929active-t"
                                                style="background:#fff;color:#000;font-weight:bold;font-size:18px;line-height:22px;font-family:'Whyte',Arial,Helvetica,sans-serif;border:2px solid #000;border-radius:5px"
                                                align="center">
                                                <span style="padding:12px 27px;color:#000;text-decoration:none;display:block">
                                                    ${otp}
                                                </span>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                        <table class="m_-1937955048528333929w-100p" style="max-width:650px;margin:0 auto" width="650"
                               cellspacing="0" cellpadding="0" align="center">
                               <tbody>
                            <tr>
                                <td style="padding-top: 24px;padding-bottom: 24px;border-top: 1px solid #eaeaea;">
                                    <span style="color: #a0aec0">If you didn't attempt to sign up but received this email, apologies and please ignore. If you are concerned about your account's safety, we're here to help.</span>
                                </td>
                            </tr>
                            </tbody>
                        </table>

                    </td>
                </tr>
                </tbody>
            </table>
        </td>
    </tr>
    </tbody>
</table>
</body>
</html>`;
}
