'use client';

import React, { useCallback, useMemo, useState, useRef } from 'react';
import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { TrashIcon, XIcon } from 'lucide-react';
import { enUS } from 'date-fns/locale/en-US';

import { Overlay } from 'react-overlays';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.scss';
import MessageCard, { Message } from './MessageCard';

const locales = {
    'en-US': enUS,
};
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const DragAndDropCalendar = withDragAndDrop(Calendar);

interface CalendarEvent {
    id: string | number;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource: Message & { _id: any };
}

interface PostSchedulerProps {
    messages: Message[];
    handlePost: (message: string) => void;
}

const PostScheduler = ({ messages, handlePost }: PostSchedulerProps) => {
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [draggedEventFromOutside, setDraggedEventFromOutside] = useState<Message | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [eventTarget, setEventTarget] = useState(null);
        const calendarContainerRef = useRef(null);


    const handleDragStartFromOutside = useCallback((message: Message) => {
        setDraggedEventFromOutside(message);
    }, []);

    const dragFromOutsideItem = useCallback(
        () => draggedEventFromOutside,
        [draggedEventFromOutside]
    );

    const onDropFromOutside = useCallback(
        ({ start, end, allDay }: { start: any; end: any; allDay: boolean }) => {
            if (!draggedEventFromOutside) return;
            const newEvent: CalendarEvent = {
                id: `msg-${draggedEventFromOutside._id}`,
                title: draggedEventFromOutside.text.substring(0, 30) + '...',
                start,
                end,
                allDay: allDay,
                resource: draggedEventFromOutside as Message & { _id: any },
            };
            setCalendarEvents((prev) => {
                if (prev.find((ev) => ev.id === newEvent.id)) return prev;
                return [...prev, newEvent];
            });
            setDraggedEventFromOutside(null);
        },
        [draggedEventFromOutside]
    );

    const moveEvent = useCallback(
        ({ event, start, end, isAllDay }: { event: any; start: any; end: any; isAllDay: any }) => {
            setSelectedEvent(null);
            setCalendarEvents((prev) => {
                const filtered = prev.filter((ev) => ev.id !== event.id);
                return [...filtered, { ...event, start, end, allDay: isAllDay }];
            });
        },
        []
    );

    const resizeEvent = useCallback(
        ({ event, start, end }: { event: any; start: any; end: any }) => {
            setSelectedEvent(null);
            setCalendarEvents((prev) => {
                const filtered = prev.filter((ev) => ev.id !== event.id);
                return [...filtered, { ...event, start, end }];
            });
        },
        []
    );

    const handleSelectEvent = useCallback((event: any, e: any) => {
        // To prevent the popover from re-rendering on the same event,
        // close it first if it's already the selected one.
        if (selectedEvent && selectedEvent.id === event.id) {
            setSelectedEvent(null);
        } else {
            setSelectedEvent(event);
            setEventTarget(e.target);
        }
    }, [selectedEvent]);

    const handleDeleteEvent = useCallback(() => {
        if (!selectedEvent) return;
        setCalendarEvents((prev) =>
            prev.filter((ev) => ev.id !== selectedEvent.id)
        );
        // Close the popover after deleting
        setSelectedEvent(null);
    }, [selectedEvent]);

    const unscheduledMessages = useMemo(() => {
        const scheduledMessageIds = new Set(
            calendarEvents.map((event) => event.resource._id)
        );
        return messages.filter((msg) => !scheduledMessageIds.has(msg._id));
    }, [messages, calendarEvents]);

    const defaultDate = useMemo(() => new Date(), []);

    const closePopover = () => setSelectedEvent(null);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    Unscheduled Posts
                </h2>
                <div className="flex overflow-x-auto space-x-4 pb-4">
                    {unscheduledMessages.map((message) => (
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
                        onEventResize={resizeEvent}
                        onDropFromOutside={onDropFromOutside}
                        dragFromOutsideItem={dragFromOutsideItem}
                        onSelectEvent={handleSelectEvent}
                        onDragStart={closePopover}
                        resizable
                        selectable
                    />
                    {selectedEvent && (
                        <Overlay
                            show={!!selectedEvent}
                            target={eventTarget}
                            placement="top"
                            container={calendarContainerRef.current}
                            onHide={closePopover}
                            rootClose 
                        >
                            {({
                                props,
                                placement,
                                arrowProps,
                                show: _show,
                                ..._
                            }) => (
                                <div
                                    {...props}
                                    className="absolute z-10 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-300 dark:border-gray-700 w-64"
                                >
                                    <button
                                        onClick={closePopover}
                                        className="absolute top-1 right-1 p-1 text-gray-400 hover:text-white"
                                    >
                                        <XIcon size={16} />
                                    </button>
                                    <h4 className="font-bold text-sm mb-2 text-gray-800 dark:text-gray-100">
                                        Event Details
                                    </h4>
                                    <p className="text-xs mb-3 text-gray-600 dark:text-gray-300 italic">
                                        {selectedEvent.title}
                                    </p>
                                    <button
                                        onClick={handleDeleteEvent}
                                        className="w-full flex items-center justify-center px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900 transition-colors"
                                    >
                                        <TrashIcon className="mr-2" size={16} />
                                        Unschedule
                                    </button>
                                </div>
                            )}
                        </Overlay>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostScheduler;