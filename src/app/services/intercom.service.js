import React from 'react';
import config from 'config';

class Intercom extends React.Component {
    constructor(props){
        super(props);
    }

    render() {
        const { appId: app_id, user } = this.props;
        return <div></div>
        // return <div>{window.Intercom('boot', {app_id, ...user})}</div>
    }
}

class IntercomApiService {
    update(user) {
        if(user != null) {
            if(config.releaseStage == "production") {
                const requestOptions = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        "grant_type":"client_credentials",
                        "client_id":"41d4566ba22a7f9bdcbbe05700f4e954",
                        "client_secret":"b0d1769d2c908263e8ae0423058ff67f"
                     })
                };
                fetch('https://api.sendpulse.com/oauth/access_token', requestOptions)
                    .then(response => response.json())
                    .then(data => {
                        // console.log(data);
                        const requestOptions1 = {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json',
                            'Authorization': `Bearer ${data.access_token}`  },
                            body: JSON.stringify({
                                "emails":[
                                   {
                                      "email": user.email,
                                      "variables":{
                                        "Name": user.name,
                                        "Phone": user.phone,
                                        "Plan": user.Plan,
                                        "Last_Login_Time": user.lastLoginsendpulse,
                                        "Whatsapp": user.phone,
                                        "Registered_At": user.registeredTimesendpulse, 
                                        'Used_Referral_Codes' : user.usedReferralCodes,
                                        'UTM_Campaign' : user.utm_campaign,
                                        'UTM_Source' : user.utm_source,
                                        'UTM_Medium' : user.utm_medium,
                                        'UTM_Term' : user.utm_term,
                                        'UTM_Content' : user.utm_content,
                                        "Tags": user.Plan
                                      }
                                   }
                                ]
                             })
                        };
                        fetch('https://api.sendpulse.com/addressbooks/103726/emails', requestOptions1)
                            .then(response => response.json())
                            .then(data => {
                                // console.log(data);
                            } );
                    } );
            }            
        }
        
        // window.Intercom('update');
    }
}

export const IntercomAPI = new IntercomApiService();
export default Intercom;