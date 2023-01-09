import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import AppComponent from 'app.component';
import { isNil } from 'helpers/isNil';
import {
	Component,
	AgInputTextField,
	GridOptionsWrapper,
	ProvidedFilter,
	DragAndDropService,
} from '@ag-grid-community/core';
import { SetFilter, TabbedLayout } from '@ag-grid-enterprise/all-modules';

require('./assets/fonts');

// const injectTapEventPlugin = require('react-tap-event-plugin');
// injectTapEventPlugin();

window.$ = window.jQuery = require('jquery');

require('owl.carousel');
require('dotdotdot');
require('scrolltofixed');
require('jquery-ui/sortable');
require('jquery-caret');
require('tageditor');
require('jQuery-menu-aim');
require('spectrum-colorpicker');
require('jquery-nearest');
require('pdfjs-dist/webpack');

const applyAgGridOverrides = () => {
	//
	// AG.COMMUNITY: Override DragAndDropService.enterDragTargetIfExists() to suppress pinned icon in ag-dnd-ghost
	//
	const DragAndDropServiceEnterDragTargetIfExists = DragAndDropService.prototype.enterDragTargetIfExists;

	DragAndDropService.prototype.enterDragTargetIfExists = function (
		dropTarget,
		mouseEvent,
		hDirection,
		vDirection,
		fromNudge
	) {
		DragAndDropServiceEnterDragTargetIfExists.call(this, dropTarget, mouseEvent, hDirection, vDirection, fromNudge);

		if (dropTarget && dropTarget.getIconName && dropTarget.getIconName() === 'pinned') {
			this.setGhostIcon(hDirection === 1 ? 'right' : 'left');
		}
	};

	//
	// AG.COMMUNITY: Override GridOptionsWrapper.checkProperties() to suppress warnings for custom grid properties
	//
	const GridOptionsWrapperCheckProperties = GridOptionsWrapper.prototype.checkProperties;

	GridOptionsWrapper.prototype.checkProperties = function (
		userProperties,
		validPropertiesAndExceptions,
		validProperties,
		containerName,
		docsUrl
	) {
		const nonDefaultGridProperties = ['customProps', 'onCellContextMenuClosed'];

		GridOptionsWrapperCheckProperties.call(
			this,
			userProperties,
			validPropertiesAndExceptions.concat(nonDefaultGridProperties),
			validProperties.concat(nonDefaultGridProperties),
			containerName,
			docsUrl
		);
	};

	//
	// AG.COMMUNITY: Override AgInputTextField.addInputListeners() to add search icon
	//
	const AgInputTextFieldAddInputListeners = AgInputTextField.prototype.addInputListeners;

	AgInputTextField.prototype.addInputListeners = function () {
		AgInputTextFieldAddInputListeners.call(this);
		$('<div/>', { class: 'icon icon-search' }).appendTo($(this.eWrapper));
	};

	//
	// AG.COMMUNITY: Override Component.destroy() to add event when context menu is closed
	//
	const ComponentDestroy = Component.prototype.destroy;

	Component.prototype.destroy = function () {
		ComponentDestroy.call(this);

		if (this.constructor.name === 'ContextMenu') {
			if (
				this.menuList &&
				this.menuList.gridOptionsWrapper &&
				this.menuList.gridOptionsWrapper.gridOptions &&
				this.menuList.gridOptionsWrapper.gridOptions.onCellContextMenuClosed
			) {
				this.menuList.gridOptionsWrapper.gridOptions.onCellContextMenuClosed();
			}
		}
	};

	//
	// AG.COMMUNITY: Override ProvidedFilter.onUiChanged() to apply filters directly instead of "Apply" button
	//
	const onUiChanged = ProvidedFilter.prototype.onUiChanged;

	ProvidedFilter.prototype.onUiChanged = function (afterFloatingFilter) {
		onUiChanged.call(this, true);
	};

	//
	// AG.ENTERPRISE: Override SetFilter.createSetListItem() to allow filter items HTML values
	//
	const SetFilterCreateSetListItem = SetFilter.prototype.createSetListItem;

	SetFilter.prototype.createSetListItem = function (value) {
		const setListItem = SetFilterCreateSetListItem.call(this, value);

		if (
			setListItem.params.colDef &&
			setListItem.params.colDef.customProps &&
			setListItem.params.colDef.customProps.filterListItemValueRenderer
		) {
			setListItem.params.colDef.customProps.filterListItemValueRenderer(
				setListItem.value,
				setListItem.eGui,
				setListItem
			);
		}

		return setListItem;
	};

	//
	// AG.ENTERPRISE: Override getTemplate() to add popup arrow
	//
	TabbedLayout.getTemplate = function (cssClass) {
		return (
			'<div class="ag-tabs ' +
			cssClass +
			'">' +
			'<div class="ag-tabs-arrow"></div>' +
			'<div ref="eHeader" class="ag-tabs-header ' +
			(cssClass ? cssClass + '-header' : '') +
			'"></div>' +
			'<div ref="eBody" class="ag-tabs-body ' +
			(cssClass ? cssClass + '-body' : '') +
			'"></div>' +
			'</div>'
		);
	};
};

applyAgGridOverrides();

ReactDOM.render(
	<BrowserRouter>
		<AppComponent />
	</BrowserRouter>,
	document.getElementById('root')
);
