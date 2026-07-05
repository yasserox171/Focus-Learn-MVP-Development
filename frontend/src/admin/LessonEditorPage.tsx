import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Mathematics } from '@tiptap/extension-mathematics';
import 'katex/dist/katex.min.css';

import api from '../api/client';
import type { ContentBlock, Lesson } from '../api/types';
import YouTubeEmbed from '../components/YouTubeEmbed';
import { refName, useRefData } from '../pages/LessonsPage';
import { blocksToDoc, docToBlocks, extractVideoBlocks } from './tiptapBlocks';

export default function LessonEditorPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const { t, i18n } = useTranslation();
  const uiLang = i18n.resolvedLanguage ?? 'ar';
  const navigate = useNavigate();
  const { subjects, levels } = useRefData();

  const [meta, setMeta] = useState({
    title: '',
    language: 'ar' as 'ar' | 'fr',
    subject_id: 0,
    level_id: 0,
    video_url: '',
    translation_group: '',
    tags: '',
  });
  // Video blocks inside content are not editable in TipTap; keep them so
  // saving an imported lesson doesn't drop them.
  const [preservedVideoBlocks, setPreservedVideoBlocks] = useState<ContentBlock[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(isNew);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Mathematics.configure({
        katexOptions: { throwOnError: false },
      }),
    ],
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
  });

  useEffect(() => {
    if (isNew || !editor) return;
    let cancelled = false;
    api.get<Lesson>(`/lessons/${id}/`).then((r) => {
      if (cancelled || editor.isDestroyed) return;
      const lesson = r.data;
      setMeta({
        title: lesson.title,
        language: lesson.language,
        subject_id: lesson.subject.id,
        level_id: lesson.level.id,
        video_url: lesson.video_url ?? '',
        translation_group: lesson.translation_group ?? '',
        tags: lesson.tags.join(', '),
      });
      setPreservedVideoBlocks(extractVideoBlocks(lesson.content.blocks));
      editor.commands.setContent(blocksToDoc(lesson.content.blocks));
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id, isNew, editor]);

  async function save(status: 'draft' | 'published') {
    if (!editor) return;
    setMessage(null);
    const blocks = [...docToBlocks(editor.getJSON()), ...preservedVideoBlocks];
    const payload = {
      title: meta.title,
      language: meta.language,
      subject_id: meta.subject_id,
      level_id: meta.level_id,
      video_url: meta.video_url || null,
      translation_group: meta.translation_group || null,
      tags: meta.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      content: { blocks },
      status,
    };
    try {
      if (isNew) {
        await api.post('/lessons/', payload);
      } else {
        await api.patch(`/lessons/${id}/`, payload);
      }
      navigate('/admin/lessons');
    } catch {
      setMessage(t('admin.saveFailed'));
    }
  }

  function insertLatex() {
    const latex = window.prompt(t('admin.latexPrompt'));
    if (latex && editor) editor.chain().focus().insertBlockMath({ latex }).run();
  }

  function insertImage() {
    const url = window.prompt(t('admin.imageUrlPrompt'));
    if (url && editor) editor.chain().focus().setImage({ src: url }).run();
  }

  if (!loaded || !editor) return <p className="muted">{t('common.loading')}</p>;

  return (
    <div className="editor-page">
      <div className="page-head">
        <h1 className="page-title">
          {isNew ? t('admin.newLesson') : t('admin.edit')}
        </h1>
        <div className="row-actions">
          <button className="btn btn-ghost" onClick={() => save('draft')}>
            {t('admin.saveDraft')}
          </button>
          <button className="btn btn-primary" onClick={() => save('published')}>
            {t('admin.publish')}
          </button>
        </div>
      </div>
      {message && <div className="alert alert-error">{message}</div>}

      <div className="editor-meta">
        <label className="span-2">
          {t('admin.title')}
          <input
            value={meta.title}
            onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            dir={meta.language === 'ar' ? 'rtl' : 'ltr'}
          />
        </label>
        <label>
          {t('lessons.language')}
          <select
            value={meta.language}
            onChange={(e) => setMeta({ ...meta, language: e.target.value as 'ar' | 'fr' })}
          >
            <option value="ar">{t('lessons.arabic')}</option>
            <option value="fr">{t('lessons.french')}</option>
          </select>
        </label>
        <label>
          {t('lessons.subject')}
          <select
            value={meta.subject_id}
            onChange={(e) => setMeta({ ...meta, subject_id: Number(e.target.value) })}
          >
            <option value={0}>—</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {refName(s, uiLang)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('lessons.level')}
          <select
            value={meta.level_id}
            onChange={(e) => setMeta({ ...meta, level_id: Number(e.target.value) })}
          >
            <option value={0}>—</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {refName(l, uiLang)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('admin.tags')}
          <input
            value={meta.tags}
            onChange={(e) => setMeta({ ...meta, tags: e.target.value })}
            placeholder="algebra, second_degree"
          />
        </label>
        <label>
          {t('admin.translationGroup')}
          <input
            value={meta.translation_group}
            onChange={(e) => setMeta({ ...meta, translation_group: e.target.value })}
            placeholder="quad-equations-01"
          />
        </label>
        <label className="span-2">
          {t('admin.videoUrl')}
          <input
            value={meta.video_url}
            onChange={(e) => setMeta({ ...meta, video_url: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
          />
        </label>
      </div>

      {meta.video_url && (
        <details className="video-preview" open>
          <summary>{t('admin.videoPreview')}</summary>
          <YouTubeEmbed url={meta.video_url} />
        </details>
      )}

      <div className="editor-toolbar">
        <button
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H
        </button>
        <button
          className={editor.isActive('bold') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </button>
        <button
          className={editor.isActive('italic') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </button>
        <span className="toolbar-sep" />
        <button onClick={insertLatex}>∑ {t('admin.insertLatex')}</button>
        <button onClick={insertImage}>🖼 {t('admin.insertImage')}</button>
      </div>

      <div className="tiptap-wrap" dir={meta.language === 'ar' ? 'rtl' : 'ltr'}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
