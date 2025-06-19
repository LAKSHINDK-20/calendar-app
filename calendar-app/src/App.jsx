import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Search, Calendar, Clock, User, Briefcase, Heart, Star } from 'lucide-react';

const CalendarApp = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('month'); // 'month', 'week', 'day'
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    isAllDay: false,
    category: 'personal',
    recurring: 'none'
  });

  const categories = {
    personal: { name: 'Personal', color: 'bg-blue-500', icon: User },
    work: { name: 'Work', color: 'bg-green-500', icon: Briefcase },
    health: { name: 'Health', color: 'bg-red-500', icon: Heart },
    important: { name: 'Important', color: 'bg-yellow-500', icon: Star }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        month: 'prev',
        fullDate: new Date(year, month - 1, prevMonth.getDate() - i)
      });
    }
    
    // Add current month's days
    for (let date = 1; date <= daysInMonth; date++) {
      days.push({
        date,
        month: 'current',
        fullDate: new Date(year, month, date)
      });
    }
    
    // Add next month's leading days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let date = 1; date <= remainingDays; date++) {
      days.push({
        date,
        month: 'next',
        fullDate: new Date(year, month + 1, date)
      });
    }
    
    return days;
  };

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Format date as key for events storage
  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const key = formatDateKey(date);
    return events[key] || [];
  };

  // Navigate months
  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Handle date click
  const handleDateClick = (day) => {
    if (day.month === 'current') {
      setSelectedDate(day.fullDate);
    }
  };

  // Open modal for adding event
  const openAddModal = (date) => {
    setSelectedDate(date);
    setModalMode('add');
    setEventForm({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      isAllDay: false,
      category: 'personal',
      recurring: 'none'
    });
    setShowModal(true);
  };

  // Open modal for editing event
  const openEditModal = (event, date) => {
    setSelectedDate(date);
    setModalMode('edit');
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      isAllDay: event.isAllDay || false,
      category: event.category || 'personal',
      recurring: event.recurring || 'none'
    });
    setShowModal(true);
  };

  // Save event
  const saveEvent = () => {
    if (!eventForm.title.trim()) return;

    const dateKey = formatDateKey(selectedDate);
    const newEvent = {
      id: modalMode === 'edit' ? editingEvent.id : Date.now().toString(),
      title: eventForm.title,
      description: eventForm.description,
      startTime: eventForm.startTime,
      endTime: eventForm.endTime,
      isAllDay: eventForm.isAllDay,
      category: eventForm.category,
      recurring: eventForm.recurring
    };

    setEvents(prev => {
      const updated = { ...prev };
      
      if (modalMode === 'edit') {
        // Replace existing event
        updated[dateKey] = updated[dateKey].map(event => 
          event.id === editingEvent.id ? newEvent : event
        );
      } else {
        // Add new event
        if (!updated[dateKey]) updated[dateKey] = [];
        updated[dateKey].push(newEvent);
        
        // Handle recurring events
        if (eventForm.recurring !== 'none') {
          const recurringDates = generateRecurringDates(selectedDate, eventForm.recurring);
          recurringDates.forEach(date => {
            const key = formatDateKey(date);
            if (!updated[key]) updated[key] = [];
            updated[key].push({
              ...newEvent,
              id: `${newEvent.id}-${key}`,
              recurring: eventForm.recurring
            });
          });
        }
      }
      
      return updated;
    });

    setShowModal(false);
    setEditingEvent(null);
  };

  // Generate recurring dates
  const generateRecurringDates = (startDate, frequency) => {
    const dates = [];
    const maxRecurring = 10; // Limit to prevent infinite loops
    
    for (let i = 1; i <= maxRecurring; i++) {
      const newDate = new Date(startDate);
      if (frequency === 'daily') {
        newDate.setDate(startDate.getDate() + i);
      } else if (frequency === 'weekly') {
        newDate.setDate(startDate.getDate() + (i * 7));
      }
      dates.push(newDate);
    }
    
    return dates;
  };

  // Delete event
  const deleteEvent = (eventId, date) => {
    const dateKey = formatDateKey(date);
    setEvents(prev => {
      const updated = { ...prev };
      updated[dateKey] = updated[dateKey].filter(event => event.id !== eventId);
      if (updated[dateKey].length === 0) {
        delete updated[dateKey];
      }
      return updated;
    });
  };

  // Filter events by search term
  const filteredEvents = selectedDate ? 
    getEventsForDate(selectedDate).filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

  // Get week view dates
  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(currentDate.getDate() - day);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="text-blue-600" />
                Calendar App
              </h1>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['month', 'week', 'day'].map(view => (
                  <button
                    key={view}
                    onClick={() => setCurrentView(view)}
                    className={`px-3 py-1 rounded-md capitalize transition-colors ${
                      currentView === view 
                        ? 'bg-white shadow-sm text-blue-600' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            
            <h2 className="text-2xl font-semibold text-gray-800">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={() => navigateMonth(1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {currentView === 'month' && (
                <>
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 bg-green-50 border-b">
                    {daysOfWeek.map(day => (
                      <div key={day} className="p-4 text-center text-sm font-semibold text-green-600">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7">
                    {calendarDays.map((day, index) => {
                      const dayEvents = getEventsForDate(day.fullDate);
                      const isCurrentMonth = day.month === 'current';
                      const isSelected = selectedDate && day.fullDate.toDateString() === selectedDate.toDateString();
                      
                      return (
                        <div
                          key={index}
                          onClick={() => handleDateClick(day)}
                          className={`min-h-24 p-2 border-b border-r border-green-100 cursor-pointer hover:bg-blue-50 transition-colors relative ${
                            !isCurrentMonth ? 'text-gray-400 bg-gray-50/50' : ''
                          } ${isSelected ? 'bg-blue-100' : ''} ${
                            isToday(day.fullDate) ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-sm font-medium ${
                              isToday(day.fullDate) ? 'text-red' : ''
                            }`}>
                              {day.date}
                            </span>
                            {isCurrentMonth && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAddModal(day.fullDate);
                                }}
                                className={`w-5 h-5 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors ${
                                  isToday(day.fullDate) ? 'hover:bg-green-400' : ''
                                }`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          
                          {/* Event indicators */}
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map(event => {
                              const categoryInfo = categories[event.category];
                              return (
                                <div
                                  key={event.id}
                                  className={`text-xs px-2 py-1 rounded-md truncate ${categoryInfo.color} text-white`}
                                  title={event.title}
                                >
                                  {event.title}
                                </div>
                              );
                            })}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {currentView === 'week' && (
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-4">
                    {getWeekDates().map(date => {
                      const dayEvents = getEventsForDate(date);
                      return (
                        <div key={date.toDateString()} className="border rounded-lg p-3">
                          <div className={`text-center mb-3 ${isToday(date) ? 'text-blue-600 font-bold' : ''}`}>
                            <div className="text-sm text-gray-500">
                              {daysOfWeek[date.getDay()]}
                            </div>
                            <div className="text-lg">{date.getDate()}</div>
                          </div>
                          <div className="space-y-1">
                            {dayEvents.map(event => {
                              const categoryInfo = categories[event.category];
                              return (
                                <div
                                  key={event.id}
                                  className={`text-xs px-2 py-1 rounded-md ${categoryInfo.color} text-white cursor-pointer`}
                                  onClick={() => openEditModal(event, date)}
                                >
                                  {event.title}
                                </div>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => openAddModal(date)}
                            className="w-full mt-2 py-1 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                          >
                            <Plus className="w-4 h-4 inline" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Events Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {selectedDate ? `Events for ${selectedDate.toDateString().split(' ').slice(0, 3).join(' ')}` : 'Select a date'}
              </h3>
              
              {selectedDate && (
                <>
                  <button
                    onClick={() => openAddModal(selectedDate)}
                    className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Event
                  </button>

                  <div className="space-y-3">
                    {filteredEvents.length === 0 ? (
                      <p className="text-gray-500 text-sm">No events for this day</p>
                    ) : (
                      filteredEvents.map(event => {
                        const categoryInfo = categories[event.category];
                        const CategoryIcon = categoryInfo.icon;
                        
                        return (
                          <div key={event.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${categoryInfo.color}`}></div>
                                <h4 className="font-medium text-gray-800 text-sm">{event.title}</h4>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => openEditModal(event, selectedDate)}
                                  className="p-1 text-gray-500 hover:text-blue-600 rounded"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => deleteEvent(event.id, selectedDate)}
                                  className="p-1 text-gray-500 hover:text-red-600 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            
                            {event.description && (
                              <p className="text-xs text-gray-600 mb-2">{event.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <CategoryIcon className="w-3 h-3" />
                                {categoryInfo.name}
                              </div>
                              {!event.isAllDay && event.startTime && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {event.startTime}
                                  {event.endTime && ` - ${event.endTime}`}
                                </div>
                              )}
                              {event.isAllDay && (
                                <span className="text-blue-600">All Day</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Event Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {modalMode === 'edit' ? 'Edit Event' : 'Add New Event'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Event description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(categories).map(([key, category]) => (
                      <option key={key} value={key}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={eventForm.isAllDay}
                    onChange={(e) => setEventForm(prev => ({ ...prev, isAllDay: e.target.checked }))}
                    className="text-blue-600"
                  />
                  <label htmlFor="allDay" className="text-sm font-medium text-gray-700">
                    All Day Event
                  </label>
                </div>

                {!eventForm.isAllDay && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={eventForm.startTime}
                        onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={eventForm.endTime}
                        onChange={(e) => setEventForm(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {modalMode === 'add' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recurring
                    </label>
                    <select
                      value={eventForm.recurring}
                      onChange={(e) => setEventForm(prev => ({ ...prev, recurring: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="none">No Repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEvent}
                  disabled={!eventForm.title.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {modalMode === 'edit' ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarApp;