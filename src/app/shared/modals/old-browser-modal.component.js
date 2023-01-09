import React from 'react';

class OldBrowserModalComponent extends React.Component {
	render () {
		const { resources } = this.props;
		return (
			<div className="old-browser-modal-component">
				<div className="old-browser-modal-head">
					<div className="icon-background">
						<div className="icon icon-man" />
					</div>

					<div className="old-browser-modal-claim">{resources.browserOutdatedText}</div>
				</div>

				<div className="old-browser-modal-bottom">
					<p>{resources.internetExplorerNotSupportedText}</p>

					<p>
						{resources.forSecurityUseFollowingBrowsersText}
					</p>

					<div className="old-browser-modal-list">
						<a
							className="old-browser-alternative"
							href="https://www.mozilla.org/de/firefox/"
							target="_blank"
						>
							<img src="/assets/images/firefox.png" height="60" />
							<span>{resources.str_firefox}</span>
						</a>

						<a className="old-browser-alternative" href="https://www.opera.com/de/computer" target="_blank">
							<img src="/assets/images/opera.png" height="60" />
							<span>{resources.str_opera}</span>
						</a>

						<a className="old-browser-alternative" href="https://www.google.com/chrome/" target="_blank">
							<img src="/assets/images/chrome.png" height="60" />
							<span>{resources.str_chrome}</span>
						</a>

						<a
							className="old-browser-alternative"
							href="https://support.apple.com/downloads/safari"
							target="_blank"
						>
							<img src="/assets/images/safari.png" height="60" />
							<span>{resources.str_safari}</span>
						</a>
					</div>
				</div>
			</div>
		);
	}
}

export default OldBrowserModalComponent;
