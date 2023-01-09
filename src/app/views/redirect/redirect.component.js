import React, { Fragment } from 'react';
import { Redirect } from 'react-router-dom';
import config from 'config';
import invoiz from '../../services/invoiz.service';

class RedirectComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            longUrl: null,
            redirectAvailable: true
        }
    }

    componentDidMount() {
        const shortUrl = this.props.match.params.shortUrl;
        try {
            invoiz
                .request(`${config.redirect.resourceUrl}/${shortUrl}`)
                .then(res => {
                    this.setState({redirectAvailable: true, longUrl: res.body.data.longUrl});
                })
        }
        catch(error) {
            this.setState({redirectAvailable: false})
        }
    }

    render() {
        if (this.state.redirectAvailable) {
            if(this.state.longUrl)
                window.location.href = this.state.longUrl
        } else {
            return <Redirect push to="/" />
        }
        return <div></div>
    }
}

export default RedirectComponent;