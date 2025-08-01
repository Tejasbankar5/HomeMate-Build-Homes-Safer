import React, { useState, useEffect } from 'react';
import './calender.css';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState({});
  const [newTask, setNewTask] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [bookmarkedDates, setBookmarkedDates] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [dragTask, setDragTask] = useState(null);

  // Generate days for the current month view
  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    
    return days;
  };

  // Get starting day of the month to pad calendar
  const getStartingDay = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Format date as YYYY-MM-DD for task storage
  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Add a new task
  const addTask = () => {
    if (!newTask.trim()) return;
    
    const dateKey = formatDateKey(selectedDate);
    const taskId = Date.now();
    const task = {
      id: taskId,
      text: newTask,
      priority: taskPriority,
      completed: false
    };
    
    setTasks(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), task]
    }));
    
    setNewTask('');
    setShowTaskForm(false);
  };

  // Toggle task completion
  const toggleTaskCompletion = (dateKey, taskId) => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  // Delete a task
  const deleteTask = (dateKey, taskId) => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter(task => task.id !== taskId)
    }));
  };

  // Toggle bookmark for a date
  const toggleBookmark = (date) => {
    const dateStr = date.toDateString();
    setBookmarkedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr) 
        : [...prev, dateStr]
    );
  };

  // Check if date is bookmarked
  const isBookmarked = (date) => {
    return bookmarkedDates.includes(date.toDateString());
  };

  // Handle drag start for task
  const handleDragStart = (e, task, dateKey) => {
    setDragTask({ task, sourceDate: dateKey });
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over for date cell
  const handleDragOver = (e, date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop to move task to new date
  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    if (!dragTask) return;
    
    const targetDateKey = formatDateKey(targetDate);
    
    // Remove from source date
    const updatedTasks = { ...tasks };
    updatedTasks[dragTask.sourceDate] = updatedTasks[dragTask.sourceDate]?.filter(
      t => t.id !== dragTask.task.id
    );
    
    // Add to target date
    updatedTasks[targetDateKey] = [
      ...(updatedTasks[targetDateKey] || []),
      dragTask.task
    ];
    
    setTasks(updatedTasks);
    setDragTask(null);
  };

  // Mock weather data fetch
  useEffect(() => {
    const fetchWeather = async () => {
      // In a real app, you would call a weather API here
      setTimeout(() => {
        setWeatherData({
          temp: Math.floor(Math.random() * 30) + 10,
          condition: ['Sunny', 'Cloudy', 'Rainy', 'Stormy'][Math.floor(Math.random() * 4)],
          icon: '☀️'
        });
      }, 500);
    };
    
    fetchWeather();
  }, [currentDate]);

  // Generate calendar grid
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const startingDay = getStartingDay(year, month);
    
    // Pad beginning of calendar with empty cells
    const calendarDays = [];
    for (let i = 0; i < startingDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Add actual days of the month
    daysInMonth.forEach(day => {
      const dateKey = formatDateKey(day);
      const dayTasks = tasks[dateKey] || [];
      const isSelected = selectedDate.toDateString() === day.toDateString();
      const isToday = new Date().toDateString() === day.toDateString();
      
      calendarDays.push(
        <div 
          key={day.getDate()}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => setSelectedDate(day)}
          onDragOver={(e) => handleDragOver(e, day)}
          onDrop={(e) => handleDrop(e, day)}
        >
          <div className="day-header">
            <span className="day-number">{day.getDate()}</span>
            <button 
              className={`bookmark-btn ${isBookmarked(day) ? 'bookmarked' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(day);
              }}
            >
              {isBookmarked(day) ? '★' : '☆'}
            </button>
          </div>
          <div className="day-tasks-preview">
            {dayTasks.slice(0, 2).map(task => (
              <div 
                key={task.id} 
                className={`task-preview ${task.priority}`}
                draggable
                onDragStart={(e) => handleDragStart(e, task, dateKey)}
              >
                {task.text}
              </div>
            ))}
            {dayTasks.length > 2 && (
              <div className="more-tasks">+{dayTasks.length - 2} more</div>
            )}
          </div>
        </div>
      );
    });
    
    return calendarDays;
  };

  // Render tasks for selected date
  const renderSelectedDateTasks = () => {
    const dateKey = formatDateKey(selectedDate);
    const dayTasks = tasks[dateKey] || [];
    
    return (
      <div className="selected-date-tasks">
        <h3>
          Tasks for {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
          <button 
            className="add-task-btn"
            onClick={() => setShowTaskForm(!showTaskForm)}
          >
            +
          </button>
        </h3>
        
        {showTaskForm && (
          <div className="task-form">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Enter task description"
              autoFocus
            />
            <div className="priority-selector">
              <span>Priority:</span>
              <button 
                className={`priority-btn low ${taskPriority === 'low' ? 'active' : ''}`}
                onClick={() => setTaskPriority('low')}
              >
                Low
              </button>
              <button 
                className={`priority-btn medium ${taskPriority === 'medium' ? 'active' : ''}`}
                onClick={() => setTaskPriority('medium')}
              >
                Medium
              </button>
              <button 
                className={`priority-btn high ${taskPriority === 'high' ? 'active' : ''}`}
                onClick={() => setTaskPriority('high')}
              >
                High
              </button>
            </div>
            <div className="form-actions">
              <button onClick={addTask}>Add Task</button>
              <button onClick={() => setShowTaskForm(false)}>Cancel</button>
            </div>
          </div>
        )}
        
        {dayTasks.length === 0 ? (
          <p className="no-tasks">No tasks scheduled for this day.</p>
        ) : (
          <ul className="task-list">
            {dayTasks.map(task => (
              <li 
                key={task.id} 
                className={`task-item ${task.priority} ${task.completed ? 'completed' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, task, dateKey)}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTaskCompletion(dateKey, task.id)}
                />
                <span className="task-text">{task.text}</span>
                <button 
                  className="delete-task"
                  onClick={() => deleteTask(dateKey, task.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <h1>
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h1>
        <div className="calendar-nav">
          <button onClick={prevMonth}>&lt;</button>
          <button onClick={() => setCurrentDate(new Date())}>Today</button>
          <button onClick={nextMonth}>&gt;</button>
        </div>
      </div>
      
      <div className="calendar-grid">
        <div className="day-name">Sun</div>
        <div className="day-name">Mon</div>
        <div className="day-name">Tue</div>
        <div className="day-name">Wed</div>
        <div className="day-name">Thu</div>
        <div className="day-name">Fri</div>
        <div className="day-name">Sat</div>
        
        {renderCalendar()}
      </div>
      
      <div className="calendar-details">
        <div className="weather-card">
          {weatherData ? (
            <>
              <h3>Weather</h3>
              <div className="weather-info">
                <span className="weather-icon">{weatherData.icon}</span>
                <span className="weather-temp">{weatherData.temp}°C</span>
                <span className="weather-condition">{weatherData.condition}</span>
              </div>
            </>
          ) : (
            <p>Loading weather...</p>
          )}
        </div>
        
        {renderSelectedDateTasks()}
        
        <div className="bookmarks-section">
          <h3>Bookmarked Dates</h3>
          {bookmarkedDates.length === 0 ? (
            <p>No dates bookmarked yet</p>
          ) : (
            <ul className="bookmarks-list">
              {bookmarkedDates.map(dateStr => {
                const date = new Date(dateStr);
                return (
                  <li 
                    key={dateStr}
                    className={selectedDate.toDateString() === dateStr ? 'active' : ''}
                    onClick={() => setSelectedDate(date)}
                  >
                    {date.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                    <button 
                      className="remove-bookmark"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(date);
                      }}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;