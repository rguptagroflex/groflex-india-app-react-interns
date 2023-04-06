import invoiz from 'services/invoiz.service';
import React from 'react';
import PropTypes from 'prop-types';
import SubMenuBarComponent from 'shared/nav-main/components/submenu-bar.component';
import SubMenuItemComponent from 'shared/nav-main/components/submenu-item.component';
import userPermissions from 'enums/user-permissions.enum';
import planPermissions from 'enums/plan-permissions.enum';


const buildSubmenuComponents = (permissions, canViewDunning, canViewTimesheet, noInventory, submenuItems, activeSubmenuItem, resources) => {
	const { canImportArticle, canImportContact } = permissions;
	if (!canImportArticle && !canImportContact) {
		submenuItems = submenuItems.filter(item => item.name !== 'dataImport');
	}

	if (!canViewDunning) {
		submenuItems = submenuItems.filter(item => item.name !== 'dunning');
	}
	// In all case we need to show timesheet
	// if (!canViewTimesheet) {
	// 	submenuItems = submenuItems.filter(item => item.name !== 'timetracking');
	// }

	if(noInventory) {
		submenuItems = submenuItems.filter(item => item.name !== 'inventory');
	}

	return submenuItems.map(submenuItemData => {
		const { name } = submenuItemData;		
		let active;

		if (name === activeSubmenuItem) {
			active = true;
		}

		return <SubMenuItemComponent key={name} active={active} {...submenuItemData} resources={resources}/>;
	});
};

class MenuItemWithSubmenuComponent1 extends React.Component {
	constructor(props) {
		super(props);

		const { activeSubmenuItem } = this.props;

		this.state = {
			submenuVisible: false,
			activeSubmenuItem,
			isCollapsedState: false,
			canViewTextBlocks: null,
			canViewDunning: null,
			canViewTimesheet: null,
			planRestricted: null,
			canChangeAccountData: null,
			noInventory: null
		};

		this.windowResizeTimeout = null;
		this.onWindowResize = this.onWindowResize.bind(this);

		$(window).off('resize', this.onWindowResize);
		$(window).on('resize', this.onWindowResize);
	}

	componentDidMount() {
		this.setState({
			canViewTextBlocks: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_TEXT_MODULES),
			canViewDunning: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_DUNNING),
			canViewTimesheet: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_TIMESHEET),
			planRestricted: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_OFFER),
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA),
			noInventory: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_INVENTORY),
		});
		this.onWindowResize();
		invoiz.on('triggerSubmenuHide', this.hideSubmenu, this);
		invoiz.on('triggerSubmenuSwitch', this.switchSubmenu, this);
	}

	componentWillReceiveProps(newProps) {
		const { activeSubmenuItem } = newProps;
		const { activeSubmenuItem: currentActiveSubmenuItem } = this.state;

		if (activeSubmenuItem !== currentActiveSubmenuItem) {
			this.setState({ activeSubmenuItem });
		}
	}

	componentWillUnmount() {
		invoiz.off('triggerSubmenuHide', this.hideSubmenu, this);
		invoiz.off('triggerSubmenuSwitch', this.switchSubmenu, this);
		$(window).off('resize', this.onWindowResize);
	}

	hideSubmenu(noChangeTrigger) {
		this.setState({ submenuVisible: false }, () => {
			const { onSubmenuVisiblityChanged } = this.props;

			if (!noChangeTrigger) {
				onSubmenuVisiblityChanged(false);
			}
		});
	}

	isSubmenuClick(evt) {
		return evt && evt.nativeEvent.target && $(evt.nativeEvent.target).closest('.submenu').length > 0;
	}

	showSubmenu(evt, isClick, checkCollapsedState) {
		const { isCollapsedState } = this.state;
		const isSubmenuClick = isClick && this.isSubmenuClick(evt);
		let showSubmenu = true;

		if (checkCollapsedState) {
			showSubmenu = !isCollapsedState;
		}

		if (!isSubmenuClick && showSubmenu) {
			invoiz.trigger('triggerSubmenuSwitch');

			this.setState({ submenuVisible: true }, () => {
				const { onSubmenuVisiblityChanged } = this.props;
				onSubmenuVisiblityChanged(true);

				if (isClick) {
					this.navigateToFirstSubmenuItem();
				}
			});
		}
	}

	navigateToFirstSubmenuItem(evt) {
		const { submenuItems } = this.props;
		const isSubmenuClick = this.isSubmenuClick(evt);

		if (submenuItems && submenuItems[0].url && !isSubmenuClick) {
			// if (submenuItems[0].url !== '/offers') {
			// 	invoiz.offerListNaviagtion = false;
			// }
			invoiz.router.navigate(submenuItems[0].url);
		}
	}

	switchSubmenu() {
		this.setState({ submenuVisible: false });
	}

	onWindowResize() {
		clearTimeout(this.windowResizeTimeout);

		this.windowResizeTimeout = setTimeout(() => {
			if (this.refs.subMenuBarNormal || this.refs.subMenuBarCollapsed) {
				this.setState({ isCollapsedState: !window.matchMedia('(min-width:1300px)').matches });

				if (!window.matchMedia('(min-width:1300px)').matches) {
					this.hideSubmenu();
				}
			}
		}, 100);
	}

	render() {
		const { submenuVisible, activeSubmenuItem, isCollapsedState, canViewDunning, canViewTimesheet, noInventory, canView } = this.state;
		const { title, name, submenuItems, icon, active, hasImprintAndPrivacy, resourceKey, resources, permissions } = this.props;
		const submenuItemComponents = buildSubmenuComponents(permissions, canViewDunning, canViewTimesheet, noInventory, submenuItems, activeSubmenuItem, resources);
		const iconClass = `icon icon-${icon}`;
		const activeClass = active ? 'icon-arr_down menuItem-active' : 'icon-arr_right';
		const className = `menuItem menuItem-hasSubmenu ${iconClass} ${activeClass}`;

		return isCollapsedState ? (
			<li key={name}>
				<div
					ref="subMenuBarCollapsed"
					onMouseEnter={() => this.showSubmenu()}
					onMouseLeave={() => this.hideSubmenu()}
					onClick={e => this.navigateToFirstSubmenuItem(e)}
					className={className}
					data-href={submenuItems[0].url}
					data-qs-id={`global-menu-item-${name}`}
				>
				{resources.menuItems[resourceKey]}
				{/* <span className="collapsed-title">
					{resources.menuItems[resourceKey]}
				</span>				 */}
			</div>
			<SubMenuBarComponent key={`sub-item-${name}`}
					visible={submenuVisible}
					title={title}
					name={name}
					hasImprintAndPrivacy={hasImprintAndPrivacy}
					resourceKey={resourceKey}
					resources={resources}
				>
					{submenuItemComponents}
			</SubMenuBarComponent>
			</li>
			
		) : (
			<li key={name}>
			<div
				ref="subMenuBarNormal"
				onClick={e => this.showSubmenu(e, true)}
				className={className}
				data-href={submenuItems[0].url}
				data-qs-id={`global-menu-item-${name}`}
			>
				{/* {title} */}
				{resources.menuItems[resourceKey]}
				{/* <span className="collapsed-title">
					
					{resources.menuItems[resourceKey]}
				</span> */}
				
			</div>
			<SubMenuBarComponent key={`sub-item-${name}`}
					visible={submenuVisible}
					title={title}
					name={name}
					hasImprintAndPrivacy={hasImprintAndPrivacy}
					resourceKey={resourceKey}
					resources={resources}
				>
					{submenuItemComponents}
				</SubMenuBarComponent>
			</li>
		);
	}
}

MenuItemWithSubmenuComponent1.propTypes = {
	title: PropTypes.string,
	url: PropTypes.string,
	icon: PropTypes.string,
	active: PropTypes.bool,
	submenuItems: PropTypes.array,
	activeSubmenuItem: PropTypes.string,
	onSubmenuVisiblityChanged: PropTypes.func,
	resourceKey: PropTypes.string
};

MenuItemWithSubmenuComponent1.defaultProps = {
	title: '',
	url: '',
	icon: '',
	active: false,
	submenuItems: [],
	activeSubmenuItem: '',
	resourceKey: ''
};

export default MenuItemWithSubmenuComponent1;
