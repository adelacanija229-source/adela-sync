import React, { useState, useEffect } from 'react';

const EditorModal = ({ isOpen, onClose, onSave, item, type, currentUser }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    tag: '',
    author: currentUser?.name || '디자인팀장',
    attendees: [],
    content: '',
    isPinned: false,
    attachments: [],
    isCompleted: false,
    completionNote: '',
    deadline: '' // New field
  });

  // Reset form when modal opens or item changes
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          ...item,
          attendees: item.attendees || [],
          attachments: item.attachments || [],
          isCompleted: item.isCompleted || false,
          completionNote: item.completionNote || ''
        });
      } else {
        let defaultTag = '공지';
        if (type === 'meeting') defaultTag = '회의록';
        if (type === 'webapp') defaultTag = '가이드';
        if (type === 'claim') defaultTag = '견적';
        if (type === 'resource') defaultTag = '단가표';

        setFormData({
          title: '',
          date: new Date().toISOString().split('T')[0],
          tag: defaultTag,
          author: currentUser?.name || '디자인팀장',
          attendees: [],
          content: '',
          isPinned: false,
          attachments: [],
          isCompleted: false,
          completionNote: '',
          deadline: ''
        });
      }
    }
  }, [isOpen, item, type, currentUser?.name]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: inputType === 'checkbox' ? checked : value 
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          attachments: [
            ...prev.attachments,
            {
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result // Base64 string
            }
          ]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleAttendeesChange = (e) => {
    const attendees = e.target.value.split(',').map(s => s.trim());
    setFormData(prev => ({ ...prev, attendees }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const getTitle = () => {
    if (item) return '수정하기';
    if (type === 'notice') return '새 공지 작성';
    if (type === 'meeting') return '새 회의 기록';
    if (type === 'claim') return '새 고객 클레임 등록';
    if (type === 'resource') return '새 자료 업로드';
    return '새 웹앱 관련 기록';
  };

  const renderTags = () => {
    if (type === 'notice') {
      return (
        <>
          <option value="공지">공지</option>
          <option value="안내">안내</option>
          <option value="긴급">긴급</option>
        </>
      );
    }
    if (type === 'meeting') {
      return (
        <>
          <option value="안건제안">안건제안</option>
          <option value="회의록">회의록</option>
        </>
      );
    }
    if (type === 'claim') {
      return (
        <>
          <option value="견적">견적</option>
          <option value="시공">시공</option>
          <option value="디자인">디자인</option>
          <option value="기타">기타</option>
        </>
      );
    }
    if (type === 'resource') {
      return (
        <>
          <option value="단가표">단가표</option>
          <option value="자재라이브러리">자재라이브러리</option>
        </>
      );
    }
    return (
      <>
        <option value="가이드">가이드</option>
        <option value="자료">자료</option>
        <option value="오류보고">오류보고</option>
        <option value="요청">요청</option>
      </>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{getTitle()}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="checkbox-group" style={{ marginBottom: '1rem' }}>
              <input 
                type="checkbox" 
                name="isPinned" 
                checked={formData.isPinned || false} 
                onChange={handleChange} 
              />
              <span>상단에 고정하기</span>
            </label>
            <label>제목</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="제목을 입력하세요" 
              required 
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>날짜</label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>태그 (또는 현장명)</label>
              <select name="tag" value={formData.tag} onChange={handleChange}>
                {renderTags()}
              </select>
            </div>
            <div className="form-group">
              <label>마감일 (선택사항)</label>
              <input 
                type="date" 
                name="deadline" 
                value={formData.deadline || ''} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-group">
            <label>{type === 'meeting' ? '참석자 (쉼표로 구분)' : '작성자'}</label>
            {type === 'meeting' ? (
              <input 
                type="text" 
                name="attendees" 
                value={formData.attendees.join(', ')} 
                onChange={handleAttendeesChange} 
                placeholder="홍길동, 김철수..." 
                required 
              />
            ) : (
              <input 
                type="text" 
                name="author" 
                value={formData.author} 
                onChange={handleChange} 
                required 
              />
            )}
          </div>

          <div className="form-group">
            <label>내용</label>
            <textarea 
              name="content" 
              value={formData.content} 
              onChange={handleChange} 
              placeholder="내용을 입력하세요" 
              rows="8"
              required 
            />
          </div>

          <div className="file-upload-group">
            <label>첨부 파일 (이미지 및 문서)</label>
            <div className="file-input-wrapper" style={{ marginTop: '0.5rem' }}>
              <button type="button" className="btn-file-upload">
                <span>📁 파일 선택</span>
              </button>
              <input type="file" multiple onChange={handleFileChange} />
            </div>
            
            {formData.attachments.length > 0 && (
              <div className="attachment-list">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                    <button type="button" className="btn-remove-file" onClick={() => removeAttachment(index)}>&times;</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(type === 'webapp' || type === 'claim') && (
            <div className="completion-section">
              <label className="checkbox-group" style={{ marginBottom: '1rem' }}>
                <input 
                  type="checkbox" 
                  name="isCompleted" 
                  checked={formData.isCompleted || false} 
                  onChange={handleChange} 
                />
                <span style={{ fontWeight: 600, color: '#1a7f37' }}>✅ 처리 완료 체크</span>
              </label>
              
              {formData.isCompleted && (
                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <label>완료 내용 (피드백)</label>
                  <textarea 
                    name="completionNote" 
                    value={formData.completionNote} 
                    onChange={handleChange} 
                    placeholder="처리 완료된 내용이나 피드백을 입력하세요" 
                    rows="3"
                  />
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>취소</button>
            <button type="submit" className="btn-primary">저장하기</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditorModal;
