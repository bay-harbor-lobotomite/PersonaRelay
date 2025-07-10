'use client';

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar';
// Make sure these fetchers are updated to handle the new API responses
import { schedulePostOnBackend, unschedulePostOnBackend } from '@/app/lib/fetchers'; 
import useWebSocket from 'react-use-websocket';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
import { TrashIcon, XIcon } from 'lucide-react';
import { enUS } from 'date-fns/locale/en-US';
import { Overlay } from 'react-overlays';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.scss';
import '@/app/calendar-overrides.css'
import MessageCard, { Message } from './MessageCard'; // Assuming Message type is now correct
import { ToastContainer, toast } from 'react-toastify';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const DragAndDropCalendar = withDragAndDrop(Calendar);

// Updated interface to reflect that resource *is* the Message from the DB
interface CalendarEvent {
    id: string; // Use the message's _id
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource: Message; // The resource is the full message object
}

interface PostSchedulerProps {
    messages: Message[];
    handlePost: (message: string) => void;
}

const PostScheduler = ({ messages, handlePost }: PostSchedulerProps) => {
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [unscheduled, setUnscheduled] = useState<Message[]>([]);
    // ----------------------------

    const [draggedEventFromOutside, setDraggedEventFromOutside] = useState<Message | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [eventTarget, setEventTarget] = useState(null);
    const calendarContainerRef = useRef(null);

    // Helper to convert a Message to a CalendarEvent
    const messageToCalendarEvent = (message: Message): CalendarEvent | null => {
        if (!message.scheduled_time) return null;
        return {
            id: message._id,
            title: message.text.substring(0, 30) + '...',
            start: new Date(message.scheduled_time),
            end: new Date(message.scheduled_time), // Adjust if you use time ranges
            allDay: false,
            resource: message,
        };
    };

    useEffect(() => {
        const initialEvents: CalendarEvent[] = [];
        const initialUnscheduled: Message[] = [];

        messages.forEach(msg => {
            if (msg.schedule_status === 'scheduled') {
                const event = messageToCalendarEvent(msg);
                if (event) initialEvents.push(event);
            } else if (msg.schedule_status === 'unscheduled') {
                initialUnscheduled.push(msg);
            }
            else if (msg.schedule_status === 'posted' || msg.schedule_status === 'failed') {
                const event = messageToCalendarEvent(msg);
                if (event) initialEvents.push(event);
            }
        });
        initialUnscheduled.reverse()

        setCalendarEvents(initialEvents);
        setUnscheduled(initialUnscheduled);
    }, [messages]); // This runs once when the component gets the messages prop

    const { lastJsonMessage } = useWebSocket('ws://localhost:8000/ws', {
        onOpen: () => console.log('WebSocket connected'),
        onClose: () => console.log('WebSocket disconnected'),
        shouldReconnect: () => true,
    });

    useEffect(() => {
        if (!lastJsonMessage) return;
        
        const updatedMessage: Message = lastJsonMessage
        if(updatedMessage.text)
        toast.success("Posted! : " + updatedMessage.text.substring(0, 30) + '...');

        if (updatedMessage.schedule_status === 'unscheduled') {
            setCalendarEvents(prev => prev.filter(ev => ev.resource._id !== updatedMessage._id));
            setUnscheduled(prev => {
                // Add to unscheduled list only if it's not already there
                if (prev.some(msg => msg._id === updatedMessage._id)) return prev;
                return [...prev, updatedMessage];
            });
        }
        // B. Handle posts that become SCHEDULED (or get a status update like 'posted'/'failed')
        else {
            setUnscheduled(prev => prev.filter(msg => msg._id !== updatedMessage._id));
            const newEvent = messageToCalendarEvent(updatedMessage);
            if (newEvent) {
                setCalendarEvents(prev => {
                    // Replace existing event or add new one
                    const filtered = prev.filter(ev => ev.resource._id !== updatedMessage._id);
                    return [...filtered, newEvent];
                });
            }
        }
    }, [lastJsonMessage]);

    const handleDragStartFromOutside = useCallback((message: Message) => {
        setDraggedEventFromOutside(message);
    }, []);

    const dragFromOutsideItem = useCallback(() => draggedEventFromOutside, [draggedEventFromOutside]);
    
    // --- 3. ACTION HANDLERS: Update state based on API responses ---

    const onDropFromOutside = useCallback(async ({ start }: { start: Date }) => {
        if (!draggedEventFromOutside) return;
        
        // The repost flag is now a backend concern. We can hardcode it here.
        const updatedMessage = await schedulePostOnBackend(draggedEventFromOutside._id, start);
        if (!updatedMessage) return; // API call failed

        // The API response is the source of truth.
        setUnscheduled(prev => prev.filter(msg => msg._id !== updatedMessage._id));
        const newEvent = messageToCalendarEvent(updatedMessage);
        if (newEvent) {
            setCalendarEvents(prev => [...prev, newEvent]);
        }
        setDraggedEventFromOutside(null);
    }, [draggedEventFromOutside]);

    const moveEvent = useCallback(async ({ event, start }: { event: CalendarEvent; start: Date }) => {
        if (event.resource.schedule_status === 'posted') return; // Disallow moving posted events
        setSelectedEvent(null);

        // The backend handles revoke+create atomically. We just call schedule.
        const updatedMessage = await schedulePostOnBackend(event.resource._id, start);
        if (!updatedMessage) return;

        const newEvent = messageToCalendarEvent(updatedMessage);
        if(newEvent) {
             setCalendarEvents(prev => {
                const filtered = prev.filter(ev => ev.resource._id !== updatedMessage._id);
                return [...filtered, newEvent];
            });
        }
    }, []);

    const handleDeleteEvent = useCallback(async () => {
        if (!selectedEvent) return;

        const unscheduledMessage = await unschedulePostOnBackend(selectedEvent.resource.task_id!);
        if (!unscheduledMessage) return;

        // API response dictates the new state
        setCalendarEvents(prev => prev.filter(ev => ev.resource._id !== unscheduledMessage._id));
        setUnscheduled(prev => [...prev, unscheduledMessage]);
        setSelectedEvent(null);
    }, [selectedEvent]);
    
    // --- UI and Prop Getters (No major changes needed here) ---

    const handleSelectEvent = useCallback((event: CalendarEvent, e: any) => {
        if (selectedEvent && selectedEvent.id === event.id) setSelectedEvent(null);
        else {
            setSelectedEvent(event);
            setEventTarget(e.target);
        }
    }, [selectedEvent]);

    const eventPropGetter = useCallback(
        (event: CalendarEvent) => (event.resource && {
            className: 
                event.resource.schedule_status === 'posted' ? 'bg-green-500 border-green-600 text-white' :
                event.resource.schedule_status === 'failed' ? 'bg-yellow-500 border-yellow-600 text-white' :
                '',
        }),
        []
    );

    const defaultDate = useMemo(() => new Date(), []);
    const closePopover = () => setSelectedEvent(null);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                <h2 className="text-lg font-semibold mb-3 text-white">
                    Unscheduled Posts
                </h2>
                <div className="flex overflow-x-auto space-x-4 pb-4 custom-scrollbar">
                    {/* The list now maps over the 'unscheduled' state array */}
                    {unscheduled.map((message) => (
                        <MessageCard
                            key={message._id}
                            message={message}
                            handlePost={handlePost}
                            onDragStart={handleDragStartFromOutside}
                        />
                    ))}
                </div>
            </div>

            <div className="flex-grow p-4 min-h-0 relative" ref={calendarContainerRef}>
                <div className="h-full">
                    <DragAndDropCalendar
                        className='z-0'
                        defaultDate={defaultDate}
                        defaultView={Views.MONTH}
                        events={calendarEvents}
                        localizer={localizer}
                        onEventDrop={moveEvent}
                        onEventResize={moveEvent} // Resizing is just a form of moving
                        onDropFromOutside={onDropFromOutside}
                        dragFromOutsideItem={dragFromOutsideItem}
                        onSelectEvent={handleSelectEvent}
                        onDragStart={closePopover}
                        eventPropGetter={eventPropGetter}
                        resizable
                        selectable
                    />
                    {selectedEvent && (
                        <Overlay show={!!selectedEvent} target={eventTarget} placement="top" container={calendarContainerRef.current} onHide={closePopover} rootClose>
                            {({ props }) => (
                                <div {...props} className="absolute z-10 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-300 dark:border-gray-700 w-64">
                                    <button onClick={closePopover} className="absolute top-1 right-1 p-1 text-gray-400 hover:text-white"><XIcon size={16} /></button>
                                    <h4 className="font-bold text-sm mb-2 text-gray-800 dark:text-gray-100">Event Details</h4>
                                    <p className="text-xs mb-3 text-gray-600 dark:text-gray-300 italic">{selectedEvent.title}</p>
                                    <button
                                        onClick={handleDeleteEvent}
                                        disabled={selectedEvent.resource && selectedEvent.resource.schedule_status === 'posted'} // Disable based on real status
                                        className="w-full flex items-center justify-center px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        <TrashIcon className="mr-2" size={16} /> Unschedule
                                    </button>
                                </div>
                            )}
                        </Overlay>
                    )}
                    <ToastContainer />
                </div>
            </div>
        </div>
    );
};

export default PostScheduler;