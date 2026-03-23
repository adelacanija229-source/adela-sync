import React, { useState, useEffect } from 'react';

const DailyReportForm = ({ currentUser, projects = [], onSubmit, onSkip }) => {
  const [department, setDepartment] = useState('디자인팀');
  const [manager, setManager] = useState(currentUser?.name || '');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [taskDetails, setTaskDetails] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedProjectId) {
      alert('현장을 선택해주세요.');
      return;
    }
    if (!taskDetails.trim()) {
      alert('작업 내용을 입력해주세요.');
      return;
    }

    const project = projects.find(p => p.id === selectedProjectId);
    const siteName = project ? project.name : '';

    const reportContent = {
      department,
      manager,
      siteName,
      taskDetails
    };

    onSubmit({
      report: {
        title: `[${department}] ${manager} | ${siteName} | ${taskDetails.split('\n')[0].substring(0, 30)}`,
        content: JSON.stringify(reportContent),
        author: manager,
        category: 'daily_report',
        date: new Date().toISOString()
      },
      isNewProject: false
    });
  };

  return (
    <div className="daily-report-screen">
      <div className="login-box glassmorphism" style={{ maxWidth: '500px', width: '92%', height: 'auto', padding: '2rem' }}>
        <h2 className="login-title" style={{ marginBottom: '0.5rem' }}>오늘의 업무 보고</h2>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '2rem' }}>현장 상황을 간결하게 보고해주세요.</p>
        
        <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* 01 담당자 */}
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', display: 'block' }}>01 담당자</label>
            <input 
              type="text" 
              value={manager} 
              onChange={(e) => setManager(e.target.value)}
              placeholder="담당자 이름"
              style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)' }}
            />
          </div>

          {/* 02 부서명 */}
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', display: 'block' }}>02 부서명</label>
            <select 
              value={department} 
              onChange={(e) => setDepartment(e.target.value)}
              style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'white' }}
            >
              <option value="디자인팀">디자인팀</option>
              <option value="시공팀">시공팀</option>
              <option value="설계팀">설계팀</option>
              <option value="공무팀">공무팀</option>
              <option value="관리팀">관리팀</option>
            </select>
          </div>

          {/* 03 현장명 */}
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', display: 'block' }}>03 현장명</label>
            <select 
              value={selectedProjectId} 
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'white' }}
            >
              <option value="">-- 현장을 선택하세요 --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* 04 작업 내용 */}
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', display: 'block' }}>04 금일 작업 내용</label>
            <textarea 
              value={taskDetails} 
              onChange={(e) => setTaskDetails(e.target.value)}
              placeholder="- 작업 내용 1&#10;- 작업 내용 2 (불렛 포인트 권장)"
              style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', minHeight: '120px', resize: 'none', fontSize: '0.95rem', lineHeight: '1.5' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
            <button type="submit" style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: 600 }}>보고 완료</button>
            <button type="button" onClick={onSkip} style={{ flex: 0.5, padding: '1rem', borderRadius: '12px', background: '#f0f0f0', color: '#666', border: 'none', fontWeight: 600 }}>건너뛰기</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyReportForm;
