import invoiz from "services/invoiz.service";
import React from "react";
import config from "config";
import ButtonComponent from "shared/button/button.component";
import FilterComponent from "shared/filter/filter.component";
import FilterNewComponent from "shared/filter/filter-new.component";
import {
	fetchCustomerHistoryList,
	filterCustomerHistoryList,
	// deleteNote,
	// deleteTodo,
	// deleteEmail,
	// changeToDone,
	//newDueDate,
	//loadMore,
} from "redux/ducks/customer/customerHistoryList";
import { connect } from "react-redux";
import ModalService from "services/modal.service";
import PerfectScrollbar from "perfect-scrollbar";
import TodoItem from "shared/todo/todo-item.component";
import arrowUp from "assets/images/svg/semicircular-up-arrow.svg";
import arrowLeft from "assets/images/svg/semicircular-left-arrow.svg";
import todoImage from "assets/images/svg/to-do-list.svg";
import SVGInline from "react-svg-inline";
import WebStorageService from "services/webstorage.service";
import WebStorageKey from "enums/web-storage-key.enum";
import envelope from "assets/images/icons/mail.svg";
import HistoryItemComponent from "shared/history/history-item.component";

class CustomerHistoryListComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoaded: false,
			customer: null,
			customerHistory: this.props.customerHistoryListData.customerHistoryItems,
			//customerTodo: this.props.customerHistoryListData.customerTodoItems,
			customerEmails: this.props.customerHistoryListData.customerEmailItems,
			lastFilter: this.props.currentFilter,
			updateScrollbar: false,
			emailStatus: props.emailStatus,
			emailReloadClicked: false,
			emailStatusChangedToFinished: false,
		};

		this.scrollableContainer = React.createRef();
		this.noteTextRef = React.createRef();
		this.handleScroll = this.handleScroll.bind(this);
		this.onChangeToDone = this.onChangeToDone.bind(this);
		//this.deleteTodo = this.deleteTodo.bind(this);
		this.changeDueDate = this.changeDueDate.bind(this);
		this.perfectScrollbar = null;
		this.initScrollbar = this.initScrollbar.bind(this);
		this.reloadHistoryList = this.reloadHistoryList.bind(this);

		this.refArray = [];
		this.noteRefArray = [];
		this.longNotes = [];
		this.listDidMount = React.createRef();
	}
	componentDidMount() {
		if (this.props && this.props.customer && this.props.customer.id) {
			this.props.fetchCustomerHistoryList(this.props.customer.id, true);
		}

		if (
			invoiz.user &&
			//invoiz.user.isAppEnabledArchiveMails() &&
			//this.props.isImapActivated &&
			this.props.emailStatus !== "started"
		) {
			setTimeout(() => {
				const emailEventId = WebStorageService.getItem(WebStorageKey.EMAIL_EVENT_ID);
				const customerEmailEventId = WebStorageService.getItem(
					`customerEmailEventId-${this.props.customer.id}`
				);
				(emailEventId || customerEmailEventId) && this.props.checkEmailStatus && this.props.checkEmailStatus();
			}, 0);
		}

		if (this.listDidMount && this.listDidMount.current) {
			setTimeout(() => {
				this.initScrollbar();
			}, 0);

			this.setState({
				customer: this.props.customer,
				customerHistory: this.props.customerHistoryListData.customerHistoryItems || [],
				//customerTodo: this.props.customerHistoryListData.customerTodoItems || [],
				customerEmails: this.props.customerHistoryListData.customerEmailItems || [],
				updateScrollbar: true,
			});
		}
	}

	componentDidUpdate(prevProps) {
		if (prevProps.forceReload !== this.props.forceReload) {
			this.props.fetchCustomerHistoryList(this.props.customer.id, true);
		}
		if (
			this.listDidMount &&
			this.listDidMount.current &&
			this.listDidMount.current !== null &&
			this.perfectScrollbar &&
			this.perfectScrollbar.element !== null
		) {
			setTimeout(() => {
				this.initScrollbar();
			}, 0);
		}

		setTimeout(() => {
			this.createRefs(this.refArray);
		}, 0);

		if (prevProps.emailStatus === "started" && this.props.emailStatus === "finished") {
			this.setState({
				emailStatusChangedToFinished: true,
			});
			if (this.state.customerHistory.length === 0 && this.state.customerTodo.length === 0) {
				this.reloadHistoryList();
			}
		}
	}

	createRefs(arr) {
		this.longNotes = [];
		if (!this.props.isLoading && !this.props.isLoadingMore) {
			if (arr) {
				arr.map((node, index) => {
					if (node && node.classList.contains("history-text-done-todo")) {
						if (node.offsetHeight > 55) {
							this.longNotes.push(index);
						} else {
							$(node).parent().parent().children(".read-more-button").remove();
						}
					}
				});
			}
		}
	}

	initScrollbar() {
		if (this.perfectScrollbar) {
			this.perfectScrollbar.destroy();
			this.perfectScrollbar = null;
		}
		if ($(".customerHistory_list") && $(".customerHistory_list")[0]) {
			$(".customerHistory_list")[0].removeEventListener("scroll", this.handleScroll);
			this.perfectScrollbar = new PerfectScrollbar(".customerHistory_list", {
				suppressScrollX: true,
			});
		}

		$(".customerHistory_list")[0].addEventListener("scroll", this.handleScroll);
	}

	handleScroll() {
		let countTotal;
		const {
			filterItems,
			isLoadingMore,
			currentFilter,
			remaining,
			customerHistoryListData: { customerTodoMeta },
		} = this.props;
		const itemsCount = document.querySelectorAll(".history-item-icon-and-content").length;

		filterItems.forEach((filter, index) => {
			if (filter.active) {
				if (currentFilter === "all") {
					countTotal = filter.count;
				} else if (currentFilter === "email") {
					countTotal = filter.count;
				} else if (currentFilter === "document") {
					countTotal = filter.count;
				}
				return;
			}
		});

		if (
			remaining > 0 &&
			itemsCount !== countTotal &&
			this.perfectScrollbar &&
			this.perfectScrollbar.reach.y === "end" &&
			!isLoadingMore
		) {
			this.state.updateScrollbar && this.setState({ updateScrollbar: false });
			this.props.loadMore(this.state.customer.id);
		}
	}

	componentWillUnmount() {
		if (this.perfectScrollbar) {
			this.perfectScrollbar.destroy();
			this.perfectScrollbar = null;
		}
		if ($(".customerHistory_list") && $(".customerHistory_list")[0]) {
			$(".customerHistory_list")[0].removeEventListener("scroll", this.handleScroll);
		}
	}

	createHeadlineText(item) {
		switch (item.currentFilter) {
			// case 'note':
			// 	return 'Notizen';
			case "document":
				return "Actions";
			// case 'todo':
			// 	return 'To-Dos';
			case "email":
				return "Communications";
			default:
				break;
		}
	}

	onChangeToDone(id) {
		!this.state.updateScrollbar && this.setState({ updateScrollbar: true });
		this.props.changeToDone(id, this.state.customer.id);
	}

	createEmailStatusRow() {
		const { emailStatus } = this.props;

		if (emailStatus === "started") {
			return (
				<div className="email-status-row u_c">
					<div className="email-status-row-spinner-wrapper">
						<div className="email-status-row-spinner" />
						<div className="email-status-row-spinner-image-container u_hc">
							<SVGInline className="email-status-icon" svg={envelope} width="14px" />
						</div>
					</div>
					<div className="email-status-row-text text-semibold">Dein E-Mail-Verlauf wird abgerufen.</div>
				</div>
			);
		} else if (emailStatus === "finished") {
			return (
				<div className="email-status-row u_c">
					<div className="email-status-finished-icon-container u_c">
						<div className="icon icon-check"></div>
					</div>

					<div className="email-status-row-text text-semibold">
						Dein E-Mail-Verlauf wurde erfolgreich abgerufen.{" "}
						<span className="email-status-row-text-link" onClick={() => this.reloadHistoryList()}>
							Jetzt anzeigen
						</span>
					</div>
				</div>
			);
		}
	}

	reloadHistoryList() {
		return new Promise((resolve, reject) => {
			this.props.fetchCustomerHistoryList(this.props.customer.id, true);
			resolve();
		})
			.then(() => {
				this.setState(
					{
						emailReloadClicked: true,
						emailStatusChangedToFinished: false,
					},
					() => {
						this.initScrollbar();
					}
				);
			})
			.catch((err) => {
				console.log(err);
			});
	}

	// createCustomerTodoTableRows(todos, meta) {
	// 	if (todos) {
	// 		const rows = [];
	// 		const { currentFilter } = this.props;

	// 		todos.map((todo, index) => {
	// 			const todoContent = (
	// 				<TodoItem
	// 					key={`${currentFilter}-todo-${index}`}
	// 					todo={todo}
	// 					changeToDone={this.onChangeToDone}
	// 					onDelete={this.deleteTodo}
	// 					changeDueDate={this.changeDueDate}
	// 					additionalClass={`history-item-icon-and-content ${
	// 						meta.count === 0 && index === todos.length - 1 ? 'last-and-no-history-on-page' : ''
	// 					}`}
	// 				/>
	// 			);
	// 			rows.push(todoContent);
	// 		});

	// 		return rows;
	// 	}
	// }

	createCustomerHistoryTableRows(customerHistoryItems) {
		if (customerHistoryItems) {
			const rows = [];
			customerHistoryItems.map((item) => {
				const { id, historyType } = item;
				const { currentFilter } = this.props;
				rows.push(
					<HistoryItemComponent
						key={`${currentFilter}-${historyType}-${id}-content`}
						item={item}
						customerId={this.props.customer.id}
						customer={this.props.customer}
						// onDeleteEmail={(id) => {
						// 	this.props.deleteEmail(id, this.props.customer.id);
						// 	if (this.perfectScrollbar) {
						// 		!this.state.updateScrollbar && this.setState({ updateScrollbar: true });
						// 	}
						// }}
						// onDeleteActivity={(id) => {
						// 	this.props.deleteNote(id, this.props.customer.id);
						// 	if (this.perfectScrollbar) {
						// 		!this.state.updateScrollbar && this.setState({ updateScrollbar: true });
						// 	}
						// }}
					/>
				);
			});

			return rows;
		}
	}

	// deleteTodo(id) {
	// 	ModalService.open('Möchtest du dein To-Do wirklich löschen?', {
	// 		headline: 'To-Do löschen',
	// 		cancelLabel: 'Abbrechen',
	// 		confirmLabel: 'Löschen',
	// 		confirmIcon: 'icon-trashcan',
	// 		confirmButtonType: 'danger',
	// 		onConfirm: () => {
	// 			ModalService.close();
	// 			this.props.deleteTodo(id, this.props.customer.id);
	// 			if (this.perfectScrollbar) {
	// 				!this.state.updateScrollbar && this.setState({ updateScrollbar: true });
	// 			}
	// 		},
	// 	});
	// }

	// deleteNote(id) {
	// 	ModalService.open('Möchtest du deine Aktivität wirklich löschen?', {
	// 		headline: 'Aktivität löschen',
	// 		cancelLabel: 'Abbrechen',
	// 		confirmLabel: 'Löschen',
	// 		confirmIcon: 'icon-trashcan',
	// 		confirmButtonType: 'danger',
	// 		onConfirm: () => {
	// 			ModalService.close();
	// 			this.props.deleteNote(id, this.props.customer.id);
	// 			if (this.perfectScrollbar) {
	// 				!this.state.updateScrollbar && this.setState({ updateScrollbar: true });
	// 			}
	// 		},
	// 	});
	// }

	changeDueDate(id, date) {
		const label = date.format(config.dateFormat.client);
		const dateValue = date.format(config.dateFormat.api);

		ModalService.open(`Möchtest du dein ToDo wirklich auf ${label} neu datieren?`, {
			headline: "ToDo neu datieren",
			cancelLabel: "Abbrechen",
			confirmLabel: "Neu datieren",
			confirmIcon: "icon-edit",
			confirmButtonType: "primary",
			onConfirm: () => {
				ModalService.close();
				this.props.newDueDate(id, dateValue, this.state.customer.id);
			},
		});
	}

	onFilterHistoryList(filter, customerId) {
		if (filter !== this.state.lastFilter) {
			this.refArray = [];
			this.noteRefArray = [];
			this.longNotes = [];
			this.props.filterCustomerHistoryList(filter, customerId);
			!this.state.updateScrollbar && this.setState({ updateScrollbar: true });
		}
	}

	render() {
		const {
			isLoading,
			isLoadingMore,
			filterItems,
			errorOccurred,
			currentFilter,
			customerHistoryListData: { customerHistoryItems, customerTodoItems, meta, customerTodoMeta },
			emailStatus,
			resources,
		} = this.props;

		const { emailStatusChangedToFinished } = this.state;

		if (this.perfectScrollbar && this.state.updateScrollbar) {
			this.perfectScrollbar.update();
		}

		// const emailStatusRow =
		// 	invoiz.user.isAppEnabledArchiveMails() && this.props.isImapActivated && this.createEmailStatusRow();
		const emailStatusRow = this.createEmailStatusRow();
		const rowsHistory = this.createCustomerHistoryTableRows(customerHistoryItems);
		//const rowsTodo = this.createCustomerTodoTableRows(customerTodoItems, meta);

		let isCurrentFilterEmpty;
		for (const filterItem of filterItems) {
			if (filterItem.key === currentFilter && filterItem.count === 0) {
				isCurrentFilterEmpty = true;
				break;
			}
		}

		const isOpenTodosNotEmpty =
			this.props.customerHistoryListData &&
			this.props.customerHistoryListData.customerTodoItems &&
			this.props.customerHistoryListData.customerTodoItems.length > 0;

		const isEmptyHistoryList = customerHistoryItems && customerHistoryItems.length === 0;

		const emptyListContent = (
			<div className="empty-list-box-customer u_c">
				{/* <div className="text-and-icon-wrapper add add-document">
					<SVGInline className="arrow arrow-left" svg={arrowLeft} width="124px" height="83px" />
					<div className="text-placeholder">Begin by creating documents here</div>
				</div> */}
				{/* <div className="text-and-icon-wrapper add add-todo u_c">
					<SVGInline className="arrow arrow-up" svg={arrowUp} width="97px" height="113px" />
					<div className="text-placeholder">Hier kannst du To-Dos oder Notizen hinzufügen</div>
				</div> */}
				<div className="text-and-icon-wrapper main-wrapper">
					<SVGInline className="todo-list-image" svg={todoImage} width="96px" height="126px" />
					<div className="text-placeholder main-text">No activities available</div>
				</div>
			</div>
		);
		const finishedButShow = emailStatus === "finished" && emailStatusChangedToFinished;
		return (
			<div className="box-rounded flex-grow history-list">
				{meta.count === 0 ? (
					<div className="history-empty-list-box">{emptyListContent}</div>
				) : (
					<React.Fragment>
						<div className="history-list-header">
							{/* <div className="pagebox_heading text-h4">
								{!isLoading &&
									(isCurrentFilterEmpty
										? null
										: 'Activities')}
							</div> */}
							<div className="history-list-head-content">
								<FilterNewComponent
									items={filterItems}
									resources={resources}
									onChange={(filter) => {
										this.onFilterHistoryList(filter, this.props.customer.id);
										this.setState({
											emailReloadClicked: false,
											emailStatusChangedToFinished: false,
										});
									}}
									hideCount={false}
								/>
							</div>
						</div>

						<div className="pagebox_content customerHistory_container">
							<div className="customerHistory_list" ref={this.listDidMount}>
								{errorOccurred ? (
									<div className="customer-history-error u_c">
										<div>
											<div className="error-headline">
												<h1>An error occurred!</h1>
											</div>
											<div>
												<ButtonComponent
													callback={() => invoiz.router.reload()}
													label={"Reload"}
												/>
											</div>
										</div>
									</div>
								) : (
									<React.Fragment>
										{isLoading && !isLoadingMore ? (
											<div className="history-loader-wrapper">
												<div className="history-loader-rectangle first"></div>
												<div className="history-loader-rectangle second"></div>
												<div className="history-loader-rectangle third"></div>
												<div className="history-loader-rectangle fourth"></div>
												<div className="history-loader-rectangle fifth"></div>
												<div className="history-loader-rectangle sixth"></div>
												<div className="history-loader-rectangle seventh"></div>
											</div>
										) : (
											<React.Fragment>
												{isEmptyHistoryList ? (
													emptyListContent
												) : (
													<div className="history-list-wrapper">
														{emailStatus === "started" || finishedButShow
															? emailStatusRow
															: null}
														{/* <div>{rowsTodo}</div> */}
														{/* {!!rowsHistory.length && (
															<div className="pagebox_heading text-semibold u_mt_20">
																Aktivitäten
															</div>
														)} */}
														{!!rowsHistory.length && <div>{rowsHistory}</div>}
													</div>
												)}
											</React.Fragment>
										)}
									</React.Fragment>
								)}
							</div>
						</div>
						<div className="fade-out"></div>
					</React.Fragment>
				)}
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const {
		isLoading,
		isLoadingMore,
		currentFilter,
		errorOccurred,
		currentPage,
		totalPages,
		filterItems,
		remaining,
		customerHistoryListData,
	} = state.customer.customerHistoryList;

	const { resources } = state.language.lang;

	return {
		isLoading,
		isLoadingMore,
		currentFilter,
		errorOccurred,
		currentPage,
		totalPages,
		filterItems,
		remaining,
		customerHistoryListData,
		resources,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		fetchCustomerHistoryList: (customerId, reset) => {
			dispatch(fetchCustomerHistoryList(customerId, reset));
		},
		filterCustomerHistoryList: (filterItem, customerId) => {
			dispatch(filterCustomerHistoryList(filterItem, customerId));
		},
		// deleteTodo: (id, customerId) => {
		// 	dispatch(deleteTodo(id, customerId));
		// },
		// deleteNote: (id, customerId) => {
		// 	dispatch(deleteNote(id, customerId));
		// },
		// deleteEmail: (id, customerId) => {
		// 	dispatch(deleteEmail(id, customerId));
		// },
		// changeToDone: (id, customerId) => {
		// 	dispatch(changeToDone(id, customerId));
		// },
		newDueDate: (id, date, customerId) => {
			dispatch(newDueDate(id, date, customerId));
		},
		loadMore: (customerId) => {
			dispatch(loadMore(customerId));
		},
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(CustomerHistoryListComponent);
