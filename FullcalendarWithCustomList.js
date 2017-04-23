	var JCIAPAC = JCIAPAC || {};

	JCIAPAC.FullCalendar = JCIAPAC.FullCalendar ||
	{       
		glEvents: [],
		displayFormUrl: '',
		initailizeData: function(){
			var date = new Date(),
				filterJSON = {	$select : 'id,Title,JCIAPACEventStartTime,JCIAPACEventEndTime,JCIAPACEventsDescription,JCIAPACAttendees/Id,Author/Id',
								$expand : 'JCIAPACAttendees/Id,Author/Id',
								$filter : "((Author/Id eq "+ _spPageContextInfo.userId +" or JCIAPACAttendees/Id eq "+ _spPageContextInfo.userId + ") and (JCIAPACEventEndTime ge '"+ moment(date).subtract(30, 'days').toISOString() +"'))",
								$orderBy :'Id desc',
								$top : 5000
							}
			JCIAPAC.execute('getDefaultFormUrl','APACEvents',"DefaultDisplayFormUrl")
					        .success(function(data){ 
								console.info('data loaded',data);
								displayFormUrl =  data.d.DefaultDisplayFormUrl;
							})
							.error(function (error) {
								console.error('Error occurred while fetching the data...',error);
								alert(JSON.stringify(error));
							})
			JCIAPAC.execute("getListDataByFilter",'APACEvents',filterJSON,false)
							.success(function (data) {
								if(data.d != undefined && data.d.results.length > 0)
			                    {
			                    	var events = data.d.results;
				                    for (var i = 0; i < events.length; i++) { 
									  //  alert(events[i].Title); 
									  var startLocalTime  = moment.utc(events[i].JCIAPACEventStartTime).toDate();
				   						  startLocalTime = moment(startLocalTime).format('YYYY-MM-DD HH:mm:ss');
				   					  var endLocalTime = moment.utc(events[i].JCIAPACEventEndTime).toDate();
				   						  endLocalTime = moment(endLocalTime).format('YYYY-MM-DD HH:mm:ss');
										JCIAPAC.FullCalendar.glEvents.push({ 
											id : events[i].ID, 
											title: events[i].Title, 
											start: startLocalTime, 
											end: endLocalTime, 
											description: events[i].JCIAPACEventsDescription,  
											allDay: false,
											isRecurrence: false
										}); 
									} 
			                    }
								//Calender initialization 
								JCIAPAC.FullCalendar.IntFullCalendar(); 
							})
							.error(function (error) {
								console.error('Error occurred while fetching the data...',error);
								alert(JSON.stringify(error));
							})
		},
		IntFullCalendar: function() { 
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
		        displayEventEnd :false,  // shows end date
		        nextDayThreshold: "00:00:00", // When an event's end time spans into another day, the minimum time it must be in order for it to render as if it were on that day
		        timeFormat: 'h:mma ',
		        theme: false, // Use JQuery UI theme
		        fixedWeekCount: false,  // If true, the calendar will always be 6 weeks tall. If false, the calendar will have either 4, 5, or 6 weeks, depending on the month.
		        eventLimit: true, // allow "more" link when too many events
		        eventClick: JCIAPAC.FullCalendar.goToEvent, 
		        //select: selectDate, 
		        events: JCIAPAC.FullCalendar.glEvents, 
		        height: 420, 
		        //eventDrop: eventDropped, 
		        //eventResize: eventResized, 
		        selectable: true, 
		        selectHelper: true, 
		        editable: false 
		        
		    }); 

		    jQuery('.fc-time').css({
		    	'display':'none'
		    })
		},
		goToEvent: function(event){
			document.location.href = displayFormUrl +"?ID=" + event.id + "&Source="+encodeURIComponent(window.location.href);
		}
	};