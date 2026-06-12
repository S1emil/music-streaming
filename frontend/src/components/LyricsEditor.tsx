import React from 'react';
import { tracks as tracksApi } from '../services';
import { FiEdit2, FiSave, FiX, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface LyricsEditorProps {
  trackId: string;
  initialLyrics: string | null;
  onSave: (lyrics: string) => void;
  readonly?: boolean;
}

const LyricsEditor: React.FC<LyricsEditorProps> = ({ trackId, initialLyrics, onSave, readonly = false }) => {
  const [lyrics, setLyrics] = React.useState(initialLyrics || '');
  const [editing, setEditing] = React.useState(!initialLyrics && !readonly);
  const [fetching, setFetching] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const handleFetchFromGenius = async () => {
    setFetching(true);
    try {
      const result = await tracksApi.fetchLyrics(trackId);
      setLyrics(result.lyrics);
      toast.success(`Текст получен из ${result.source}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Не удалось получить текст');
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await tracksApi.saveLyrics(trackId, lyrics);
      onSave(lyrics);
      setEditing(false);
      toast.success('Текст сохранён');
    } catch (error: any) {
      toast.error('Не удалось сохранить текст');
    } finally {
      setSaving(false);
    }
  };

  if (!lyrics && readonly) {
    return null;
  }

  return (
    <div className="lyrics-editor">
      <div className="lyrics-header">
        <h3>Текст песни</h3>
        {!readonly && (
          <div className="lyrics-actions">
            {!editing && lyrics && (
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
                <FiEdit2 size={14} /> Редактировать
              </button>
            )}
            {editing && (
              <>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleFetchFromGenius}
                  disabled={fetching}
                >
                  <FiSearch size={14} /> {fetching ? 'Получение...' : 'Получить с Genius'}
                </button>
                {lyrics && (
                  <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
                    <FiX size={14} /> Отмена
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="lyrics-input-container">
          <textarea
            className="lyrics-input"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Введите текст песни... или нажмите «Получить с Genius»"
            rows={20}
          />
          <div className="lyrics-input-footer">
            <span className="char-count">{lyrics.length} символов</span>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              <FiSave size={14} /> {saving ? 'Сохранение...' : 'Сохранить текст'}
            </button>
          </div>
        </div>
      ) : (
        <div className="lyrics-display">
          {lyrics ? (
            <pre className="lyrics-text">{lyrics}</pre>
          ) : (
            <p className="no-lyrics">Текст песни пока не добавлен</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LyricsEditor;
