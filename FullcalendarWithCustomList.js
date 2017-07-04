var CRUD = CRUD || {};

CRUD.FullCalendar = CRUD.FullCalendar ||
	{
		glEvents: [],
		displayFormUrl: '',
		initailizeData: function () {
			var date = new Date(),
				filterJSON = {
					$select: 'id,Title,CRUDEventStartTime,CRUDEventEndTime,CRUDEventsDescription,CRUDAttendees/Id,Author/Id',
					$expand: 'CRUDAttendees/Id,Author/Id',
					$filter: "((Author/Id eq " + _spPageContextInfo.userId + " or CRUDAttendees/Id eq " + _spPageContextInfo.userId + ") and (CRUDEventEndTime ge '" + moment(date).subtract(30, 'days').toISOString() + "'))",
					$orderBy: 'Id desc',
					$top: 5000
				}
			CRUD.execute('getDefaultFormUrl', 'APACEvents', "DefaultDisplayFormUrl")
				.success(function (data) {
					console.info('data loaded', data);
					displayFormUrl = data.d.DefaultDisplayFormUrl;
				})
				.error(function (error) {
					console.error('Error occurred while fetching the data...', error);
					alert(JSON.stringify(error));
				})
			CRUD.execute("getListDataByFilter", 'APACEvents', filterJSON, false)
				.success(function (data) {
					if (data.d != undefined && data.d.results.length > 0) {
						var events = data.d.results;
						for (var i = 0; i < events.length; i++) {
							//  alert(events[i].Title); 
							var startLocalTime = moment.utc(events[i].CRUDEventStartTime).toDate();
							startLocalTime = moment(startLocalTime).format('YYYY-MM-DD HH:mm:ss');
							var endLocalTime = moment.utc(events[i].CRUDEventEndTime).toDate();
							endLocalTime = moment(endLocalTime).format('YYYY-MM-DD HH:mm:ss');
							CRUD.FullCalendar.glEvents.push({
								id: events[i].ID,
								title: events[i].Title,
								start: startLocalTime,
								end: endLocalTime,
								description: events[i].CRUDEventsDescription,
								allDay: false,
								isRecurrence: false
							});
						}
					}
					//Calender initialization 
					CRUD.FullCalendar.IntFullCalendar();
				})
				.error(function (error) {
					console.error('Error occurred while fetching the data...', error);
					alert(JSON.stringify(error));
				})
		},
		IntFullCalendar: function () {
			var date = new Date();
			var d = date.getDate();
			var m = date.getMonth();
			var y = date.getFullYear();
			jQuery('#calendar').fullCalendar({
				header: {
					left: 'prev,next today',
					center: 'title',
					right: 'month,agendaWeek,agendaDay'
				},
				displayEventEnd: false,  // shows end date
				nextDayThreshold: "00:00:00", // When an event's end time spans into another day, the minimum time it must be in order for it to render as if it were on that day
				timeFormat: 'h:mma ',
				theme: false, // Use JQuery UI theme
				fixedWeekCount: false,  // If true, the calendar will always be 6 weeks tall. If false, the calendar will have either 4, 5, or 6 weeks, depending on the month.
				eventLimit: true, // allow "more" link when too many events
				eventClick: CRUD.FullCalendar.goToEvent,
				//select: selectDate, 
				events: CRUD.FullCalendar.glEvents,
				height: 420,
				//eventDrop: eventDropped, 
				//eventResize: eventResized, 
				selectable: true,
				selectHelper: true,
				editable: false

			});

			jQuery('.fc-time').css({
				'display': 'none'
			})
		},
		goToEvent: function (event) {
			document.location.href = displayFormUrl + "?ID=" + event.id + "&Source=" + encodeURIComponent(window.location.href);
		}
	};