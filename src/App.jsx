import React, { useState, useEffect } from 'react';
import { storage } from './utils/storage';
import { supabase } from './utils/supabaseClient';
import EditorModal from './components/EditorModal';
import DailyReportForm from './components/DailyReportForm';
import logo from './assets/logo.png';
import './index.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // { name: string, role: 'admin' | 'user' }
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState('user'); // admin, user
  const [loginName, setLoginName] = useState('');
  
  const [view, setView] = useState('dashboard'); // dashboard, detail
  const [activeTab, setActiveTab] = useState('notice'); // notice, meeting, claim
  const [selectedItem, setSelectedItem] = useState(null);
  const [notices, setNotices] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [claims, setClaims] = useState([]);
  const [resources, setResources] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('notice');
  const [editingItem, setEditingItem] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [customBg, setCustomBg] = useState(localStorage.getItem('doh_login_bg') || '');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      const [n, m, c, r, dr, p] = await Promise.all([
        storage.get('notice'),
        storage.get('meeting'),
        storage.get('claim'),
        storage.get('resource'),
        storage.get('daily_report'),
        storage.get('project')
      ]);
      setNotices(n);
      setMeetings(m);
      setClaims(c);
      setResources(r);
      setDailyReports(dr);
      setProjects(p.map(proj => {
        try {
          const parsed = JSON.parse(proj.content);
          return { ...proj, ...parsed }; // Merge parsed deadlines/dates into the object
        } catch (e) {
          return proj;
        }
      }));
      setIsLoading(false);
    };

    if (isLoggedIn) {
      fetchAll();

      // Real-time subscription
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'posts' },
          (payload) => {
            console.log('Real-time change received:', payload);
            fetchAll(); // Refresh all for simplicity and to ensure correct ordering/state
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginRole === 'admin') {
      if (password === '0229') {
        setCurrentUser({ name: '디자인팀장', role: 'admin' });
        setIsLoggedIn(true);
        setView('daily_report_prompt');
      } else {
        alert('관리자 비밀번호가 틀렸습니다.');
      }
    } else {
      if (!loginName.trim()) {
        alert('이름을 입력해주세요.');
        return;
      }
      if (password === '0456') {
        setCurrentUser({ name: loginName, role: 'user' });
        setIsLoggedIn(true);
        setView('daily_report_prompt');
      } else {
        alert('비밀번호가 틀렸습니다.');
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setPassword('');
    setLoginName('');
    setView('dashboard');
  };

  const handleBgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setCustomBg(base64);
        localStorage.setItem('doh_login_bg', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetBg = () => {
    setCustomBg('');
    localStorage.removeItem('doh_login_bg');
  };

  const navigateToDetail = (type, item) => {
    setSelectedItem({ ...item, type });
    setView('detail');
    window.scrollTo(0, 0);
  };

  const goHome = () => {
    setView('dashboard');
    setSelectedItem(null);
    window.scrollTo(0, 0);
  };

  const handleOpenAddModal = (type) => {
    setModalType(type || activeTab);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = () => {
    setModalType(selectedItem.type);
    setEditingItem(selectedItem);
    setIsModalOpen(true);
  };

  const updateList = (type, updated) => {
    if (type === 'notice') setNotices(prev => prev.map(n => n.id === updated.id ? updated : n));
    else if (type === 'meeting') setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));
    else if (type === 'claim') setClaims(prev => prev.map(c => c.id === updated.id ? updated : c));
    else if (type === 'resource') setResources(prev => prev.map(r => r.id === updated.id ? updated : r));
    else if (type === 'daily_report') setDailyReports(prev => prev.map(d => d.id === updated.id ? updated : d));
    else if (type === 'project') setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const addToList = (type, added) => {
    if (type === 'notice') setNotices(prev => [added, ...prev]);
    else if (type === 'meeting') setMeetings(prev => [added, ...prev]);
    else if (type === 'claim') setClaims(prev => [added, ...prev]);
    else if (type === 'resource') setResources(prev => [added, ...prev]);
    else if (type === 'daily_report') setDailyReports(prev => [added, ...prev]);
    else if (type === 'project') setProjects(prev => [added, ...prev]);
  };

  const handleSave = async (formData) => {
    if (editingItem) {
      const updated = await storage.save(modalType, formData);
      updateList(modalType, updated);
      setSelectedItem({ ...updated, type: modalType });
    } else {
      const added = await storage.save(modalType, formData);
      addToList(modalType, added);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    await storage.delete(selectedItem.type, selectedItem.id);
    if (selectedItem.type === 'notice') setNotices(prev => prev.filter(n => n.id !== selectedItem.id));
    else if (selectedItem.type === 'meeting') setMeetings(prev => prev.filter(m => m.id !== selectedItem.id));
    else if (selectedItem.type === 'claim') setClaims(prev => prev.filter(c => c.id !== selectedItem.id));
    else if (selectedItem.type === 'resource') setResources(prev => prev.filter(r => r.id !== selectedItem.id));
    else if (selectedItem.type === 'daily_report') setDailyReports(prev => prev.filter(d => d.id !== selectedItem.id));
    else if (selectedItem.type === 'project') setProjects(prev => prev.filter(p => p.id !== selectedItem.id));
    
    setIsConfirmOpen(false);
    goHome();
  };

  const getFilteredItems = (items) => {
    const filtered = items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Sort: Pinned first, then date (newest first)
    return [...filtered].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date) - new Date(a.date);
    });
  };

  const isNew = (dateString) => {
    try {
      const postDate = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - postDate);
      const diffHours = diffTime / (1000 * 60 * 60);
      return diffHours <= 48; // New if within 48 hours
    } catch (e) {
      return false;
    }
  };

  const renderDeadlines = () => {
    // Collect all automated deadlines from projects and manual deadlines from other items
    const allDeadlines = [];
    
    projects.forEach(p => {
      if (p.deadlines) {
        p.deadlines.forEach(d => {
          allDeadlines.push({ ...d, projectName: p.name, sourceId: p.id, sourceType: 'project' });
        });
      }
    });

    [...notices, ...meetings, ...claims].forEach(item => {
      if (item.deadline) {
        allDeadlines.push({ 
          type: 'manual', 
          title: item.title, 
          date: item.deadline, 
          status: item.isCompleted ? 'completed' : 'pending',
          projectName: item.tag || '기타',
          sourceId: item.id,
          sourceType: item.type
        });
      }
    });

    // Sort by date
    allDeadlines.sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
      <div className="deadline-overview">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {allDeadlines.map((d, idx) => {
            const isOverdue = new Date(d.date) < new Date().setHours(0,0,0,0) && d.status !== 'completed';
            return (
              <div key={idx} className={`deadline-card ${isOverdue ? 'overdue' : ''}`} style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderLeft: `6px solid ${isOverdue ? '#ff4d4d' : 'var(--primary-color)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#888', textTransform: 'uppercase' }}>{d.projectName}</span>
                  {isOverdue && <span style={{ background: '#fff0f0', color: '#ff4d4d', padding: '0.2rem 0.6rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 'bold' }}>OVERDUE</span>}
                </div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#333' }}>{d.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                  📅 <span style={{ fontWeight: 600 }}>{d.date}</span>
                  <span style={{ marginLeft: 'auto', padding: '0.2rem 0.7rem', borderRadius: '100px', fontSize: '0.75rem', background: d.status === 'completed' ? '#e6f7ed' : '#1a7f37', color: d.status === 'completed' ? '#1a7f37' : '#666' }}>
                    {d.status === 'completed' ? '완료' : '대기중'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {allDeadlines.length === 0 && <p style={{ textAlign: 'center', color: '#888', marginTop: '3rem' }}>현재 등록된 마감일이 없습니다.</p>}
      </div>
    );
  };

  const [expandedReports, setExpandedReports] = useState([]);

  const toggleReportExpansion = (id) => {
    setExpandedReports(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const renderDailyReportsGrouped = (reports) => {
    // Filter to show only today's reports
    const today = new Date().toISOString().split('T')[0];
    const todaysReports = reports.filter(r => r.date.startsWith(today));

    if (todaysReports.length === 0) {
      return <p style={{ color: '#888', fontStyle: 'italic', background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>아직 제출된 업무 보고가 없습니다.</p>;
    }

    return (
      <div className="report-list-container">
        {todaysReports.map(report => {
          let parsed;
          try {
            parsed = JSON.parse(report.content);
          } catch (e) {
            parsed = { siteName: '현장 미지정', taskDetails: report.content, department: '기타', manager: report.author };
          }
          
          const isExpanded = expandedReports.includes(report.id);
          const summaryLine = parsed.taskDetails?.split('\n')[0] || '내용 없음';

          return (
            <div key={report.id} className="report-item-wrapper">
              <div 
                className="report-list-item" 
                onClick={() => toggleReportExpansion(report.id)}
              >
                <span className="report-dept-tag">{parsed.department || '팀'}</span>
                <div className="report-summary-text">
                  <strong>{parsed.manager || report.author}</strong> | {parsed.siteName} | {summaryLine}
                </div>
                <span className="report-expand-icon">{isExpanded ? '▲' : '▼'}</span>
              </div>
              
              {isExpanded && (
                <div className="report-detail-expanded">
                  <div style={{ marginBottom: '0.8rem', opacity: 0.6, fontSize: '0.8rem' }}>
                    작성 시간: {new Date(report.date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', fontWeight: 400 }}>
                    {parsed.taskDetails}
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToDetail(activeTab, report);
                      }}
                    >
                      상세 보기
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDashboard = () => {
    const currentItems = 
      activeTab === 'notice' ? notices : 
      activeTab === 'meeting' ? meetings : 
      activeTab === 'claim' ? claims :
      activeTab === 'daily_report' ? dailyReports :
      resources;
    
    const filteredItems = getFilteredItems(currentItems);

    const titles = {
      notice: '📢 공지사항',
      meeting: '📝 회의 내용',
      claim: '🚨 고객 클레임 사항',
      resource: '📂 자료실',
      daily_report: '📋 금일 업무 보고',
      deadline: '⏰ 마감일 현황'
    };

    const subtitles = {
      notice: '중요한 소식을 놓치지 마세요.',
      meeting: '안건 제안 및 기록된 회의 내용입니다.',
      claim: '고객 클레임 및 개선 요구 사항을 관리합니다.',
      resource: '단가표 및 자재라이브러리 자료입니다.',
      daily_report: '부서별 각 팀원들의 오늘의 업무 보고 및 계획입니다.',
      deadline: '자동 계산된 프로젝트 마감일 및 개별 마감일 목록입니다.'
    };

    return (
      <div className="animate-fade">
        <div className="hero-section">
          <div className="hero-overlay">
            <div className="hero-logo-frame">
              <img src={logo} alt="ADELA Logo" className="hero-logo" />
            </div>
            <p className="board-subtitle" style={{ fontStyle: 'italic', marginTop: '1rem' }}>Adela design Team</p>
          </div>
        </div>

        <div className="container">
          <section className="board-section">
            <div className="section-header">
              <div>
                <h2>{titles[activeTab]}</h2>
                <p className="board-subtitle" style={{ marginBottom: 0 }}>{subtitles[activeTab]}</p>
              </div>
              <button className="add-button" onClick={() => handleOpenAddModal()}>+ {activeTab === 'notice' ? '공지' : activeTab === 'meeting' ? '기록' : '내용'} 추가</button>
            </div>

            <div className="board-controls">
              <div className="search-container">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="제목, 내용, 태그로 검색..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="list-container">
              {activeTab === 'daily_report' ? (
                renderDailyReportsGrouped(filteredItems)
              ) : activeTab === 'deadline' ? (
                renderDeadlines()
              ) : (
                filteredItems.map(item => (
                <div key={item.id} className={`list-item ${item.isPinned ? 'pinned' : ''}`} onClick={() => navigateToDetail(activeTab, item)}>
                  <div className="list-item-main">
                    {item.isPinned && <span className="pinned-badge-small">📌</span>}
                    <span className="list-item-tag">{item.tag}</span>
                    <span className="list-item-title">
                      {item.title}
                      {isNew(item.date) && <span className="new-badge">NEW</span>}
                      {item.isCompleted && <span className="status-badge status-completed">✅ 처리완료</span>}
                    </span>
                  </div>
                  <div className="list-item-meta">
                    <span className="list-item-author">
                      {activeTab === 'meeting' ? (item.attendees?.[0] + (item.attendees?.length > 1 ? ` 외 ${item.attendees.length - 1}명` : '')) : item.author}
                    </span>
                    <span className="list-item-date">{item.date}</span>
                  </div>
                </div>
              )))}
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderDetail = () => (
    <div className="container animate-fade">
      <div className="back-button" onClick={goHome}>
        ← 목록으로 돌아가기
      </div>
      <div className="detail-view">
        <header className="detail-header">
          <span className="card-tag">{selectedItem.tag}</span>
          <h1 className="board-title" style={{ fontSize: '2rem' }}>
            {selectedItem.isPinned && <span style={{ marginRight: '0.5rem' }}>📌</span>}
            {selectedItem.title}
            {selectedItem.isCompleted && <span className="status-badge status-completed" style={{ verticalAlign: 'middle', fontSize: '0.9rem' }}>✅ 처리 완료</span>}
          </h1>
          <div className="card-meta">
            <span>{selectedItem.type === 'meeting' ? selectedItem.attendees?.join(', ') : selectedItem.author}</span>
            <span>{selectedItem.date}</span>
          </div>
        </header>
        <div className="detail-content">
          {selectedItem.type === 'daily_report' ? (
            (() => {
              try {
                const parsed = JSON.parse(selectedItem.content);
                return (
                  <div style={{ lineHeight: '1.8' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8f8f8', borderRadius: '12px' }}>
                      <span style={{ fontWeight: 600, color: '#888' }}>담당자</span>
                      <span>{parsed.manager || selectedItem.author}</span>
                      <span style={{ fontWeight: 600, color: '#888' }}>부서</span>
                      <span>{parsed.department}</span>
                      <span style={{ fontWeight: 600, color: '#888' }}>현장명</span>
                      <span>{parsed.siteName}</span>
                    </div>
                    {parsed.taskDetails && (
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.8rem', fontSize: '1.1rem' }}>📋 업무 내용</strong>
                        <div style={{ whiteSpace: 'pre-wrap', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          {parsed.taskDetails}
                        </div>
                      </div>
                    )}
                  </div>
                );
              } catch(e) {
                return <div style={{ whiteSpace: 'pre-wrap' }}>{selectedItem.content}</div>;
              }
            })()
          ) : (
            selectedItem.content
          )}
        </div>

        {selectedItem.isCompleted && selectedItem.completionNote && (
          <div className="completion-box animate-scale">
            <h3>✅ 처리 완료 내역</h3>
            <div className="completion-text">{selectedItem.completionNote}</div>
          </div>
        )}

        {selectedItem.attachments && selectedItem.attachments.length > 0 && (
          <>
            {/* Image Preview Gallery */}
            {selectedItem.attachments.some(a => a.type.startsWith('image/')) && (
              <div className="preview-gallery">
                {selectedItem.attachments
                  .filter(a => a.type.startsWith('image/'))
                  .map((img, idx) => (
                    <div key={idx} className="preview-image-container">
                      <img src={img.data} alt={img.name} className="preview-image" onClick={() => window.open(img.data, '_blank')} />
                    </div>
                  ))}
              </div>
            )}

            {/* File Links Section */}
            {selectedItem.attachments.some(a => !a.type.startsWith('image/')) && (
              <div className="file-attachments">
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>첨부 파일</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                  {selectedItem.attachments
                    .filter(a => !a.type.startsWith('image/'))
                    .map((file, idx) => (
                      <a 
                        key={idx} 
                        href={file.data} 
                        download={file.name} 
                        className="file-attachment-link"
                      >
                        📄 {file.name}
                      </a>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="detail-actions">
          {(currentUser.role === 'admin' || selectedItem.author === currentUser.name) ? (
            <>
              <button className="btn-secondary" onClick={handleOpenEditModal}>수정하기</button>
              <button className="btn-danger" onClick={() => setIsConfirmOpen(true)}>삭제하기</button>
            </>
          ) : (
            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>작성자 또는 디자인팀장만 관리 가능합니다.</p>
          )}
        </div>
      </div>
    </div>
  );

  if (!isLoggedIn) {
    const timeString = currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateString = currentTime.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

    return (
      <div className="login-screen" style={customBg ? { '--login-bg': `url(${customBg})` } : {}}>
        <div className="lock-screen-info animate-fade">
          <div className="time">{timeString}</div>
          <div className="date">{dateString}</div>
        </div>
        
        <div className="login-box glassmorphism animate-fade">
          <img src={logo} alt="ADELA" className="login-logo" />
          <h2 className="login-title">Adela Design Team Sync</h2>
          
          <div className="role-selector">
            <button 
              className={`role-btn ${loginRole === 'user' ? 'active' : ''}`}
              onClick={() => setLoginRole('user')}
            >팀원 로그인</button>
            <button 
              className={`role-btn ${loginRole === 'admin' ? 'active' : ''}`}
              onClick={() => setLoginRole('admin')}
            >디자인팀장</button>
          </div>

          <form onSubmit={handleLogin}>
            {loginRole === 'user' && (
              <input 
                type="text" 
                placeholder="성함 (예: 임효정)" 
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                autoFocus={loginRole === 'user'}
              />
            )}
            <input 
              type="password" 
              placeholder="비밀번호" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus={loginRole === 'admin'}
            />
            <button type="submit">접속하기</button>
          </form>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <label className="bg-change-btn" style={{ cursor: 'pointer', fontSize: '0.8rem', opacity: 0.6, textDecoration: 'underline' }}>
              배경 변경
              <input type="file" accept="image/*" onChange={handleBgChange} style={{ display: 'none' }} />
            </label>
            {customBg && (
              <span onClick={resetBg} style={{ cursor: 'pointer', fontSize: '0.8rem', opacity: 0.6, textDecoration: 'underline' }}>
                기본 배경으로
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Syncing Hub Data...</p>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="container header-content">
          <a href="#" className="logo" onClick={goHome}>
            <img src={logo} alt="ADELA" className="logo-img" />
          </a>
          <nav className="nav-links">
            <span className={`nav-link ${view === 'dashboard' && activeTab === 'notice' ? 'active' : ''}`} onClick={() => { setActiveTab('notice'); goHome(); }}>공지사항</span>
            <span className={`nav-link ${view === 'dashboard' && activeTab === 'meeting' ? 'active' : ''}`} onClick={() => { setActiveTab('meeting'); goHome(); }}>회의 내용</span>
            <span className={`nav-link ${view === 'dashboard' && activeTab === 'claim' ? 'active' : ''}`} onClick={() => { setActiveTab('claim'); goHome(); }}>고객 클레임</span>
            <span className={`nav-link ${view === 'dashboard' && activeTab === 'resource' ? 'active' : ''}`} onClick={() => { setActiveTab('resource'); goHome(); }}>자료</span>
            <span className={`nav-link ${view === 'dashboard' && activeTab === 'daily_report' ? 'active' : ''}`} onClick={() => { setActiveTab('daily_report'); goHome(); }}>업무보고</span>
            <span className={`nav-link ${view === 'dashboard' && activeTab === 'deadline' ? 'active' : ''}`} onClick={() => { setActiveTab('deadline'); goHome(); }}>데드라인</span>
            
            <div className="header-user-info">
              <span className="header-user-icon">👤</span>
              {currentUser.name}
              <span className="header-user-role">{currentUser.role === 'admin' ? '팀장' : '팀원'}</span>
            </div>
            
            <button onClick={handleLogout} className="btn-logout" style={{ marginLeft: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: 0.7, border: '1px solid #ddd', background: 'transparent' }}>Logout</button>
          </nav>
        </div>
      </header>

      <main>
        {view === 'daily_report_prompt' ? (
          <DailyReportForm 
            currentUser={currentUser} 
            projects={projects}
            onSubmit={async (data) => {
              if (data.isNewProject) {
                // We'll pass a flag to onSubmit to create a project first
                const projectData = data.project;
                const deadlines = projectData.deadlines.map(d => ({
                  ...d,
                  date: d.date, // Already 'YYYY-MM-DD' string
                  author: currentUser.name,
                  category: 'deadline',
                  tag: projectData.name,
                  title: d.title,
                  content: '',
                }));

                const newProjectData = {
                  title: projectData.name, // Explicitly set title for project
                  name: projectData.name,
                  startDate: projectData.startDate,
                  endDate: projectData.endDate,
                  deadlines,
                  author: currentUser.name,
                  category: 'project',
                  date: new Date().toISOString()
                };
                
                newProjectData.content = JSON.stringify(newProjectData);
                
                // The parent will handle the async saving of project
                const addedProject = await storage.save('project', newProjectData);
                addToList('project', addedProject);
                return addedProject.id;
              } else {
                const addedReport = await storage.save('daily_report', data.report);
                addToList('daily_report', addedReport);
                setView('dashboard');
                setActiveTab('daily_report');
              }
            }}
            onSkip={() => {
              setView('dashboard');
            }}
          />
        ) : view === 'dashboard' ? renderDashboard() : renderDetail()}
      </main>

      <EditorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        item={editingItem} 
        type={modalType}
        currentUser={currentUser}
      />

      {isConfirmOpen && (
        <div className="modal-overlay" onClick={() => setIsConfirmOpen(false)}>
          <div className="modal-container" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>정말 삭제하시겠습니까?</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>이 작업은 되돌릴 수 없습니다.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setIsConfirmOpen(false)}>취소</button>
              <button className="btn-danger" onClick={confirmDelete}>삭제하기</button>
            </div>
          </div>
        </div>
      )}

      <footer>
        <div className="container">
          <p>© 2026 Design Operations Hub. Built with Precision.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
