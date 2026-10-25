import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Copy,
  FileText,
  ImageDown,
  Maximize,
  Merge,
  Redo2,
  Save,
  Split,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { loadLocalProject, saveLocalProject } from '../../features/local-projects/model/localProjectModel.js';
import {
  addRound,
  addStitches,
  alignRadial,
  alignStitches,
  assignRound,
  changeStitchType,
  cloneStitchSet,
  countRoundStitches,
  createEmptyChart,
  createGroup,
  deleteRound,
  deleteStitches,
  distributeStitches,
  duplicateStitches,
  generateRoundChart,
  getChartBounds,
  GRID_SIZE,
  makeStitch,
  mergeGeneratedChart,
  moveRound,
  moveStitches,
  resetRotation,
  rotateStitches,
  snapPoint,
  ungroupStitches,
  updateRound,
  validateGroup
} from '../../features/crochet/model/crochetModel.js';
import { createCrochetProjectId, createCrochetProjectRecord, DEFAULT_CROCHET_NAME, isCrochetProject, readCrochetProject } from '../../features/crochet/model/crochetProject.js';
import { STITCH_CATEGORIES, STITCH_TYPES } from '../../features/crochet/model/crochetSymbols.js';
import { clampZoom, CrochetCanvas } from './CrochetCanvas.jsx';
import { ContextMenu } from './ContextMenu.jsx';
import { InspectorPanel, SymbolLibraryPanel, TOOLS } from './CrochetPanels.jsx';
import { RoundGeneratorModal } from './RoundGeneratorModal.jsx';
import { SymbolIcon } from './SymbolGlyph.jsx';
import { useChartHistory } from './useChartHistory.js';
import { WrittenPatternModal } from './WrittenPatternModal.jsx';
import { exportChartPng } from './exportPng.js';
import './crochet.css';

const SAVE_LABELS = {
  idle: '저장 안 됨',
  dirty: '변경됨',
  saving: '저장 중…',
  saved: '저장됨',
  error: '저장 실패',
  loading: '불러오는 중…'
};

const isTypingTarget = (target) => {
  const tag = target?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
};

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = isMac ? '⌘' : 'Ctrl+';

/**
 * 코바늘 기호도안 편집기
 * @param {{ projectId: string|null, onExit: () => void, onSaved?: (id: string) => void }} props
 */
export function CrochetEditorPage({ projectId, onExit, onSaved }) {
  const history = useChartHistory(createEmptyChart());
  const { chart, commit, undo, redo, reset } = history;
  const [projectName, setProjectName] = useState(DEFAULT_CROCHET_NAME);
  const [tool, setTool] = useState('place');
  const [activeType, setActiveType] = useState('sc');
  const [activeRoundId, setActiveRoundId] = useState(chart.rounds[0].id);
  const [selection, setSelection] = useState([]);
  const [view, setView] = useState({ zoom: 1.6, panX: 0, panY: 0 });
  const [snap, setSnap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [menu, setMenu] = useState(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [patternOpen, setPatternOpen] = useState(false);
  // persist: 'idle' | 'loading' | 'saving' | 'ok' | 'error' — 변경 여부는 저장 스냅샷과 비교해 계산
  const [persist, setPersist] = useState(projectId ? 'loading' : 'idle');
  const [saved, setSaved] = useState(null);
  const [fitRequest, setFitRequest] = useState(null);
  const [notice, setNotice] = useState('');
  const [cursor, setCursor] = useState(null);

  const stageRef = useRef(null);
  const recordRef = useRef(null);
  const idRef = useRef(projectId || null);
  const clipboardRef = useRef(null);
  const pasteCountRef = useRef(0);
  const noticeTimer = useRef(null);

  const flash = useCallback((message) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 2400);
  }, []);

  // 활성 단이 사라지면 첫 단으로
  useEffect(() => {
    if (!chart.rounds.some((r) => r.id === activeRoundId)) setActiveRoundId(chart.rounds[chart.rounds.length - 1]?.id);
  }, [chart.rounds, activeRoundId]);

  // 지워진 코는 선택에서 제외
  useEffect(() => {
    setSelection((current) => {
      if (!current.length) return current;
      const ids = new Set(chart.stitches.map((s) => s.id));
      const next = current.filter((id) => ids.has(id));
      return next.length === current.length ? current : next;
    });
  }, [chart.stitches]);

  // 화면 가운데에 원점 배치
  const centerOrigin = useCallback(() => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setView((v) => ({ ...v, panX: rect.width / 2, panY: rect.height / 2 }));
  }, []);

  const fitToContent = useCallback(
    (target = chart) => {
      const rect = stageRef.current?.getBoundingClientRect();
      const visible = new Set(target.rounds.filter((r) => r.visible).map((r) => r.id));
      const bounds = getChartBounds(target.stitches.filter((s) => visible.has(s.roundId)));
      if (!rect || !bounds) {
        centerOrigin();
        return;
      }
      const pad = 60;
      const w = Math.max(bounds.maxX - bounds.minX, 40);
      const h = Math.max(bounds.maxY - bounds.minY, 40);
      const zoom = clampZoom(Math.min((rect.width - pad * 2) / w, (rect.height - pad * 2) / h, 3));
      const cx = (bounds.minX + bounds.maxX) / 2;
      const cy = (bounds.minY + bounds.maxY) / 2;
      setView({ zoom, panX: rect.width / 2 - cx * zoom, panY: rect.height / 2 - cy * zoom });
    },
    [chart, centerOrigin]
  );

  // 처음 열 때 원점을 화면 가운데로
  useLayoutEffect(() => {
    centerOrigin();
  }, [centerOrigin]);

  // 렌더 후 화면 맞춤 (불러오기·원형 생성 직후)
  useLayoutEffect(() => {
    if (fitRequest) fitToContent(fitRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitRequest]);

  // 불러오기
  useEffect(() => {
    let cancelled = false;
    if (!projectId) return undefined;
    loadLocalProject(projectId)
      .then((record) => {
        if (cancelled) return;
        if (!record || !isCrochetProject(record)) {
          setPersist('error');
          flash('코바늘 도안을 찾을 수 없습니다.');
          return;
        }
        const { projectName: name, chart: loaded } = readCrochetProject(record);
        recordRef.current = record;
        idRef.current = record.id;
        reset(loaded);
        setProjectName(name);
        setActiveRoundId(loaded.rounds[loaded.rounds.length - 1].id);
        setSaved({ chart: loaded, name });
        setPersist('ok');
        setFitRequest(loaded);
      })
      .catch(() => {
        if (cancelled) return;
        setPersist('error');
        flash('도안을 불러오지 못했습니다.');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const isDirty = saved ? saved.chart !== chart || saved.name !== projectName : chart.stitches.length > 0;
  const saveState = persist === 'loading' || persist === 'saving' ? persist : isDirty ? 'dirty' : persist === 'error' ? 'error' : saved ? 'saved' : 'idle';

  const save = useCallback(async () => {
    setPersist('saving');
    const name = projectName.trim() || DEFAULT_CROCHET_NAME;
    try {
      const id = idRef.current || createCrochetProjectId();
      const record = createCrochetProjectRecord(
        id,
        { projectName: name, stitches: chart.stitches, rounds: chart.rounds, groups: chart.groups },
        recordRef.current
      );
      await saveLocalProject(record);
      // 새 도안의 첫 저장이면 주소를 실제 id로 바꿔 새로고침해도 열리게 한다.
      if (!idRef.current) onSaved?.(id);
      idRef.current = id;
      recordRef.current = record;
      setSaved({ chart, name: projectName });
      setPersist('ok');
      flash('로컬에 저장했습니다.');
    } catch {
      setPersist('error');
      flash('저장하지 못했습니다.');
    }
  }, [chart, projectName, flash, onSaved]);

  // ── 편집 동작 ──
  const counts = useMemo(() => countRoundStitches(chart), [chart]);
  const activeRound = chart.rounds.find((r) => r.id === activeRoundId) ?? chart.rounds[0];

  const placeStitches = useCallback(
    (positions) => {
      if (!activeRound) return;
      const list = positions.map((p) => makeStitch(activeType, p.x, p.y, p.rotation, activeRound.id));
      // 숨긴 단에 놓으면 그 단을 다시 보이게 한다
      commit((c) => {
        const next = addStitches(c, list);
        return activeRound.visible ? next : updateRound(next, activeRound.id, { visible: true });
      });
      if (positions.length > 1) flash(`${STITCH_TYPES[activeType].label} ${positions.length}코를 배치했습니다.`);
    },
    [activeRound, activeType, commit, flash]
  );

  const moveSelection = useCallback(
    (ids, dx, dy) => {
      if (!ids.length || (!dx && !dy)) return;
      commit((c) => moveStitches(c, ids, dx, dy));
    },
    [commit]
  );

  const groupSelection = useCallback(
    (kind, ids = selection) => {
      const error = validateGroup(chart, ids);
      if (error) {
        flash(error);
        return;
      }
      const result = createGroup(chart, ids, kind);
      commit(result.chart);
      const label = STITCH_TYPES[chart.stitches.find((s) => s.id === ids[0]).type].label;
      flash(`${label} ${ids.length}코 ${kind === 'dec' ? '모아뜨기' : '늘려뜨기'}로 합쳤습니다.`);
    },
    [chart, selection, commit, flash]
  );

  const deleteSelection = useCallback(
    (ids = selection) => {
      if (!ids.length) return;
      commit((c) => deleteStitches(c, ids));
      setSelection([]);
    },
    [selection, commit]
  );

  const duplicateSelection = useCallback(
    (ids = selection) => {
      if (!ids.length) return;
      const result = duplicateStitches(chart, ids);
      commit(result.chart);
      setSelection(result.newIds);
    },
    [chart, selection, commit]
  );

  const copySelection = useCallback(() => {
    if (!selection.length) return;
    const set = new Set(selection);
    clipboardRef.current = {
      stitches: chart.stitches.filter((s) => set.has(s.id)),
      groups: chart.groups.filter((g) => g.stitchIds.every((id) => set.has(id)))
    };
    pasteCountRef.current = 0;
    flash(`${selection.length}코를 복사했습니다.`);
  }, [chart, selection, flash]);

  const paste = useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip?.stitches.length) return;
    pasteCountRef.current += 1;
    const offset = GRID_SIZE * 2 * pasteCountRef.current;
    const roundIds = new Set(chart.rounds.map((r) => r.id));
    const { stitches, groups } = cloneStitchSet(clip.stitches, clip.groups, offset, offset, (id) => (roundIds.has(id) ? id : activeRound.id));
    commit((c) => ({ ...c, stitches: [...c.stitches, ...stitches], groups: [...c.groups, ...groups] }));
    setSelection(stitches.map((s) => s.id));
  }, [chart.rounds, activeRound, commit]);

  const arrange = useCallback(
    (action, ids = selection) => {
      if (!ids.length) return;
      switch (action) {
        case 'rotate-cw':
          commit((c) => rotateStitches(c, ids, 15));
          break;
        case 'rotate-ccw':
          commit((c) => rotateStitches(c, ids, -15));
          break;
        case 'radial':
          commit((c) => alignRadial(c, ids));
          break;
        case 'reset-rotation':
          commit((c) => resetRotation(c, ids));
          break;
        case 'distribute-x':
          commit((c) => distributeStitches(c, ids, 'x'));
          break;
        case 'distribute-y':
          commit((c) => distributeStitches(c, ids, 'y'));
          break;
        case 'group-dec':
          groupSelection('dec', ids);
          break;
        case 'group-inc':
          groupSelection('inc', ids);
          break;
        case 'ungroup':
          commit((c) => ungroupStitches(c, ids));
          break;
        case 'delete':
          deleteSelection(ids);
          break;
        default:
          commit((c) => alignStitches(c, ids, action));
      }
    },
    [selection, commit, groupSelection, deleteSelection]
  );

  const handleAddRound = useCallback(() => {
    const result = addRound(chart);
    commit(result.chart);
    setActiveRoundId(result.round.id);
  }, [chart, commit]);

  const moveToNewRound = useCallback(
    (ids) => {
      const result = addRound(chart);
      commit(assignRound(result.chart, ids, result.round.id));
      setActiveRoundId(result.round.id);
      flash(`${ids.length}코를 ${result.round.name}으로 옮겼습니다.`);
    },
    [chart, commit, flash]
  );

  const generateRounds = useCallback(
    ({ magicRing, standing, rounds }) => {
      const rect = stageRef.current?.getBoundingClientRect();
      const center = rect
        ? snapPoint({ x: (rect.width / 2 - view.panX) / view.zoom, y: (rect.height / 2 - view.panY) / view.zoom }, GRID_SIZE)
        : { x: 0, y: 0 };
      const startIndex = chart.stitches.length ? chart.rounds.length : 0;
      const generated = generateRoundChart({ center, magicRing, standing, rounds, startIndex });
      const next = mergeGeneratedChart(chart, generated);
      commit(next);
      setActiveRoundId(generated.rounds[generated.rounds.length - 1].id);
      setSelection([]);
      setGeneratorOpen(false);
      setTool('select');
      flash(`${rounds.length}단 원형 도안을 만들었습니다.`);
      setFitRequest(next);
    },
    [chart, view, commit, flash]
  );

  const zoomBy = useCallback((factor) => {
    const rect = stageRef.current?.getBoundingClientRect();
    setView((v) => {
      const zoom = clampZoom(v.zoom * factor);
      const sx = (rect?.width ?? 0) / 2;
      const sy = (rect?.height ?? 0) / 2;
      return { zoom, panX: sx - ((sx - v.panX) * zoom) / v.zoom, panY: sy - ((sy - v.panY) * zoom) / v.zoom };
    });
  }, []);

  const exportPng = useCallback(async () => {
    if (!chart.stitches.length) {
      flash('내보낼 기호가 없습니다.');
      return;
    }
    try {
      await exportChartPng(chart, projectName);
      flash('PNG로 내보냈습니다.');
    } catch {
      flash('PNG를 만들지 못했습니다.');
    }
  }, [chart, projectName, flash]);

  // ── 단축키 ──
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isTypingTarget(event.target) || menu) return;
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      // 버튼에 포커스가 있으면 Space는 버튼 누르기로 남겨 둔다
      if (event.key === ' ' && !event.repeat && event.target?.tagName !== 'BUTTON') {
        setSpaceHeld(true);
        event.preventDefault();
        return;
      }
      if (mod && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && key === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (mod && key === 's') {
        event.preventDefault();
        save();
        return;
      }
      if (mod && key === 'c') {
        event.preventDefault();
        copySelection();
        return;
      }
      if (mod && key === 'x') {
        event.preventDefault();
        copySelection();
        deleteSelection();
        return;
      }
      if (mod && key === 'v') {
        event.preventDefault();
        paste();
        return;
      }
      if (mod && key === 'd') {
        event.preventDefault();
        duplicateSelection();
        return;
      }
      if (mod && key === 'a') {
        event.preventDefault();
        const visible = new Set(chart.rounds.filter((r) => r.visible).map((r) => r.id));
        setSelection(chart.stitches.filter((s) => visible.has(s.roundId) && (!activeOnly || s.roundId === activeRoundId)).map((s) => s.id));
        setTool('select');
        return;
      }
      if (mod && (key === '=' || key === '+')) {
        event.preventDefault();
        zoomBy(1.2);
        return;
      }
      if (mod && key === '-') {
        event.preventDefault();
        zoomBy(1 / 1.2);
        return;
      }
      if (mod && key === '0') {
        event.preventDefault();
        fitToContent();
        return;
      }
      if (mod || (event.altKey && !key.startsWith('arrow'))) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelection();
        return;
      }
      if (event.key === 'Escape') {
        setSelection([]);
        return;
      }
      if (key.startsWith('arrow') && selection.length) {
        event.preventDefault();
        const step = event.altKey ? 1 : event.shiftKey ? GRID_SIZE * 5 : GRID_SIZE;
        const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
        const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
        moveSelection(selection, dx, dy);
        return;
      }
      if (key === 'r' && selection.length) {
        arrange(event.shiftKey ? 'rotate-ccw' : 'rotate-cw');
        return;
      }
      const toolMatch = TOOLS.find((t) => t.shortcut.toLowerCase() === key);
      if (toolMatch) setTool(toolMatch.id);
    };
    const handleKeyUp = (event) => {
      if (event.key === ' ') setSpaceHeld(false);
    };
    const handleBlur = () => setSpaceHeld(false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [menu, undo, redo, save, copySelection, deleteSelection, paste, duplicateSelection, chart, activeOnly, activeRoundId, zoomBy, fitToContent, selection, moveSelection, arrange]);

  // ── 우클릭 메뉴 구성 ──
  const buildMenuItems = (ids) => {
    const byId = new Map(chart.stitches.map((s) => [s.id, s]));
    const selected = ids.map((id) => byId.get(id)).filter(Boolean);
    const hasSelection = selected.length > 0;
    const groupError = validateGroup(chart, ids);
    const inGroup = chart.groups.some((g) => g.stitchIds.some((id) => ids.includes(id)));
    const typeLabel = selected[0] ? STITCH_TYPES[selected[0].type].label : '';
    const groupHint = groupError ? groupError : `${typeLabel} ${selected.length}코`;

    if (!hasSelection) {
      return [
        { id: 'paste', label: '붙여넣기', hint: `${MOD}V`, disabled: !clipboardRef.current, onSelect: paste },
        { id: 'add-round', label: '새 단 추가', onSelect: handleAddRound },
        { id: 'generator', label: '원형 생성…', onSelect: () => setGeneratorOpen(true) },
        { id: 'fit', label: '화면에 맞추기', hint: `${MOD}0`, onSelect: () => fitToContent() }
      ];
    }

    const typeItems = STITCH_CATEGORIES.flatMap((category, index) => [
      ...(index ? [{ id: `sep-${category.id}`, separator: true }] : []),
      ...category.types.map((type) => ({
        id: `type-${type}`,
        label: STITCH_TYPES[type].label,
        glyph: <SymbolIcon type={type} size={16} />,
        checked: selected.every((s) => s.type === type) ? true : undefined,
        onSelect: () => commit((c) => changeStitchType(c, ids, type))
      }))
    ]);

    const roundItems = [
      ...chart.rounds.map((r) => ({
        id: `round-${r.id}`,
        label: `${r.name} (${counts.get(r.id) ?? 0}코)`,
        glyph: <span className="ce-menu-swatch" style={{ background: r.color }} />,
        checked: selected.every((s) => s.roundId === r.id) ? true : undefined,
        onSelect: () => commit((c) => assignRound(c, ids, r.id))
      })),
      { id: 'round-sep', separator: true },
      { id: 'round-new', label: '새 단으로', onSelect: () => moveToNewRound(ids) }
    ];

    return [
      { id: 'dec', label: '모아뜨기로 합치기', icon: Merge, disabled: !!groupError, title: groupHint, hint: groupError ? '' : `${selected.length}코`, onSelect: () => groupSelection('dec', ids) },
      { id: 'inc', label: '늘려뜨기로 합치기', icon: Split, disabled: !!groupError, title: groupHint, hint: groupError ? '' : `${selected.length}코`, onSelect: () => groupSelection('inc', ids) },
      { id: 'ungroup', label: '모아뜨기/늘려뜨기 해제', disabled: !inGroup, onSelect: () => commit((c) => ungroupStitches(c, ids)) },
      { id: 'sep-1', separator: true },
      { id: 'type', label: '기호 바꾸기', items: typeItems },
      { id: 'round', label: '단 지정', items: roundItems },
      { id: 'sep-2', separator: true },
      { id: 'rotate-cw', label: '오른쪽으로 15° 회전', hint: 'R', onSelect: () => arrange('rotate-cw', ids) },
      { id: 'rotate-ccw', label: '왼쪽으로 15° 회전', hint: '⇧R', onSelect: () => arrange('rotate-ccw', ids) },
      { id: 'radial', label: '중심 기준 방사 정렬', disabled: ids.length < 2, onSelect: () => arrange('radial', ids) },
      { id: 'sep-3', separator: true },
      { id: 'copy', label: '복사', hint: `${MOD}C`, onSelect: copySelection },
      { id: 'duplicate', label: '복제', icon: Copy, hint: `${MOD}D`, onSelect: () => duplicateSelection(ids) },
      { id: 'delete', label: '삭제', icon: Trash2, hint: 'Del', danger: true, onSelect: () => deleteSelection(ids) }
    ];
  };

  const closeMenu = useCallback(() => setMenu(null), []);
  const totalStitches = chart.stitches.length;

  return (
    <div className="ce-page">
      <header className="ce-topbar">
        <button type="button" className="ce-back" onClick={onExit}>
          <ArrowLeft size={16} /> 내 작업
        </button>
        <div className="ce-title">
          <span className="ce-kind">코바늘 기호도안</span>
          <input
            className="ce-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            aria-label="도안 이름"
            maxLength={60}
          />
        </div>
        <div className="ce-top-group" role="group" aria-label="실행 취소">
          <button type="button" className="ce-icon-btn" onClick={undo} disabled={!history.canUndo} aria-label="실행 취소" title={`실행 취소 (${MOD}Z)`}>
            <Undo2 size={16} />
          </button>
          <button type="button" className="ce-icon-btn" onClick={redo} disabled={!history.canRedo} aria-label="다시 실행" title={`다시 실행 (⇧${MOD}Z)`}>
            <Redo2 size={16} />
          </button>
        </div>
        <div className="ce-top-group" role="group" aria-label="확대">
          <button type="button" className="ce-icon-btn" onClick={() => zoomBy(1 / 1.2)} aria-label="축소" title="축소">
            <ZoomOut size={16} />
          </button>
          <button type="button" className="ce-zoom-label" onClick={() => setView((v) => ({ ...v, zoom: 1 }))} title="100%로">
            {Math.round(view.zoom * 100)}%
          </button>
          <button type="button" className="ce-icon-btn" onClick={() => zoomBy(1.2)} aria-label="확대" title="확대">
            <ZoomIn size={16} />
          </button>
          <button type="button" className="ce-icon-btn" onClick={() => fitToContent()} aria-label="화면에 맞추기" title={`화면에 맞추기 (${MOD}0)`}>
            <Maximize size={16} />
          </button>
        </div>
        <div className="ce-top-spacer" />
        <button type="button" className="ce-top-btn" onClick={() => setPatternOpen(true)}>
          <FileText size={16} /> 서술도안
        </button>
        <button type="button" className="ce-top-btn" onClick={exportPng}>
          <ImageDown size={16} /> PNG
        </button>
        <span className={`ce-save-state state-${saveState}`} role="status">
          {SAVE_LABELS[saveState]}
        </span>
        <button type="button" className="ce-top-btn primary" onClick={save} disabled={saveState === 'saving' || saveState === 'loading'}>
          <Save size={16} /> 로컬 저장
        </button>
      </header>

      <SymbolLibraryPanel
        tool={tool}
        onToolChange={setTool}
        activeType={activeType}
        onTypeChange={(type) => {
          setActiveType(type);
          if (tool !== 'row') setTool('place');
        }}
        onOpenGenerator={() => setGeneratorOpen(true)}
      />

      <main className="ce-stage" ref={stageRef}>
        <CrochetCanvas
          chart={chart}
          view={view}
          onViewChange={setView}
          tool={tool}
          activeType={activeType}
          activeRoundId={activeRound?.id}
          selection={selection}
          onSelectionChange={setSelection}
          onPlace={placeStitches}
          onMove={moveSelection}
          snap={snap}
          showGrid={showGrid}
          activeOnly={activeOnly}
          spaceHeld={spaceHeld}
          onHoverChange={setCursor}
          onOpenMenu={({ x, y, selection: ids }) => setMenu({ x, y, ids })}
        />
        <div className="ce-active-chip" aria-live="polite">
          <span className="ce-pattern-dot" style={{ background: activeRound?.color }} />
          {activeRound?.name} · <SymbolIcon type={activeType} size={16} /> {STITCH_TYPES[activeType].label}
        </div>
        {notice ? (
          <div className="ce-toast" role="status">
            {notice}
          </div>
        ) : null}
      </main>

      <InspectorPanel
        chart={chart}
        counts={counts}
        activeRoundId={activeRound?.id}
        onActiveRoundChange={setActiveRoundId}
        onAddRound={handleAddRound}
        onUpdateRound={(id, patch) => commit((c) => updateRound(c, id, patch))}
        onDeleteRound={(id) => {
          const round = chart.rounds.find((r) => r.id === id);
          const n = counts.get(id) ?? 0;
          if (n && !window.confirm(`${round?.name}과 그 안의 ${n}코를 삭제할까요?`)) return;
          commit((c) => deleteRound(c, id));
        }}
        onMoveRound={(id, delta) => commit((c) => moveRound(c, id, delta))}
        activeOnly={activeOnly}
        onActiveOnlyChange={setActiveOnly}
        selectionCount={selection.length}
        onArrange={(action) => arrange(action)}
        snap={snap}
        onSnapChange={setSnap}
        showGrid={showGrid}
        onShowGridChange={setShowGrid}
      />

      <footer className="ce-statusbar">
        <span>코 {totalStitches}개</span>
        <span>단 {chart.rounds.length}개</span>
        <span>묶음 {chart.groups.length}개</span>
        <span>선택 {selection.length}코</span>
        {cursor ? (
          <span>
            x {Math.round(cursor.x)} · y {Math.round(cursor.y)}
          </span>
        ) : null}
        <span className="ce-status-tool">{TOOLS.find((t) => t.id === (spaceHeld ? 'pan' : tool))?.label}</span>
      </footer>

      {menu ? <ContextMenu x={menu.x} y={menu.y} items={buildMenuItems(menu.ids)} onClose={closeMenu} /> : null}
      <RoundGeneratorModal open={generatorOpen} onClose={() => setGeneratorOpen(false)} onGenerate={generateRounds} />
      <WrittenPatternModal open={patternOpen} onClose={() => setPatternOpen(false)} chart={chart} projectName={projectName} />
    </div>
  );
}
