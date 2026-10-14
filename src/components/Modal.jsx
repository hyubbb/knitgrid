import { useId, useLayoutEffect, useRef } from "react";
import { X } from "lucide-react";

const openDialogs = [];
const inertElements = new Map();
let previousOverflow;

function updateBackground() {
  for (const [element, value] of inertElements) {
    if (value === null) element.removeAttribute("inert");
    else element.setAttribute("inert", value);
  }
  inertElements.clear();

  let branch = openDialogs.at(-1)?.dialog;
  while (branch && branch !== document.body) {
    const parent = branch.parentElement;
    if (!parent) break;
    for (const sibling of parent.children) {
      if (sibling === branch) continue;
      inertElements.set(sibling, sibling.getAttribute("inert"));
      sibling.setAttribute("inert", "");
    }
    branch = parent;
  }
}

function focusableElements(dialog) {
  return [
    ...dialog.querySelectorAll(
      'a[href], area[href], button, input, select, textarea, iframe, summary, [tabindex], [contenteditable="true"]',
    ),
  ]
    .filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.matches(":disabled") &&
        !element.closest("[inert]") &&
        element.getClientRects().length > 0 &&
        getComputedStyle(element).visibility !== "hidden",
    )
    .sort((a, b) => (a.tabIndex || Infinity) - (b.tabIndex || Infinity));
}

function focusDialog(dialog) {
  const elements = focusableElements(dialog);
  const initial =
    elements.find((element) => element.hasAttribute("autofocus")) ||
    elements[0] ||
    dialog;
  initial.focus({ preventScroll: true });
}

/**
 * 모달 셸: 백드롭 + image-modal 박스 + 헤더(제목/부제/닫기) + 본문(children) + 액션 슬롯.
 * 내용 구조는 모달마다 다르므로 children/actions 슬롯으로 주입한다.
 * @param {object} props
 * @param {boolean} props.open - false면 아무것도 렌더하지 않음
 * @param {string} props.title
 * @param {React.ReactNode} [props.subtitle]
 * @param {() => void} props.onClose
 * @param {string} [props.variant] - 'resize-modal' | 'crop-modal' | 'local-project-modal' 등 → image-modal에 덧붙임
 * @param {string} [props.bodyClassName] - 본문 래퍼 클래스(예: 'resize-modal-body', 'crop-modal-body'); 없으면 'image-modal-body'
 * @param {React.ReactNode} [props.actions] - image-modal-actions 내용
 * @param {string} [props.titleId]
 * @param {string} [props.closeLabel='닫기']
 * @param {React.ReactNode} props.children
 */
export function Modal({
  open,
  title,
  subtitle,
  onClose,
  variant = "",
  bodyClassName = "image-modal-body",
  actions,
  titleId,
  closeLabel = "닫기",
  children,
}) {
  const generatedTitleId = useId();
  const accessibleTitleId = titleId || generatedTitleId;
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  useLayoutEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const dialog = dialogRef.current;
    const entry = { dialog, previousFocus: document.activeElement };
    if (openDialogs.length === 0) {
      previousOverflow = {
        value: document.body.style.getPropertyValue("overflow"),
        priority: document.body.style.getPropertyPriority("overflow"),
      };
      document.body.style.setProperty("overflow", "hidden");
    }
    const nestedIndex = openDialogs.findIndex((existing) =>
      dialog.contains(existing.dialog),
    );
    if (nestedIndex === -1) openDialogs.push(entry);
    else {
      entry.previousFocus = openDialogs[nestedIndex].previousFocus;
      openDialogs.splice(nestedIndex, 0, entry);
    }
    updateBackground();
    const isTopDialog = () => openDialogs.at(-1) === entry;
    if (isTopDialog()) focusDialog(dialog);
    const observer = new MutationObserver(() => {
      if (isTopDialog()) updateBackground();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const handleKeyCapture = (event) => {
      if (!isTopDialog()) return;
      if (event.key === "Escape" && !event.isComposing) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeRef.current?.();
      } else if (event.key === "Tab") {
        event.preventDefault();
        event.stopImmediatePropagation();
        const elements = focusableElements(dialog);
        const index = elements.indexOf(document.activeElement);
        const next = event.shiftKey
          ? index <= 0
            ? elements.length - 1
            : index - 1
          : (index + 1) % elements.length;
        (elements[next] || dialog).focus({ preventScroll: true });
      } else if (!dialog.contains(event.target)) {
        event.stopImmediatePropagation();
      }
    };
    const handleFocus = (event) => {
      if (isTopDialog() && !dialog.contains(event.target)) focusDialog(dialog);
    };
    // Let controls and React handlers receive typing/Enter before blocking app shortcuts.
    const stopBackgroundKeys = (event) => {
      if (isTopDialog()) event.stopImmediatePropagation();
    };
    window.addEventListener("keydown", handleKeyCapture, true);
    document.addEventListener("focusin", handleFocus, true);
    for (const type of ["keydown", "keypress", "keyup"]) {
      document.addEventListener(type, stopBackgroundKeys);
    }

    return () => {
      const wasTopDialog = isTopDialog();
      observer.disconnect();
      window.removeEventListener("keydown", handleKeyCapture, true);
      document.removeEventListener("focusin", handleFocus, true);
      for (const type of ["keydown", "keypress", "keyup"]) {
        document.removeEventListener(type, stopBackgroundKeys);
      }
      const index = openDialogs.indexOf(entry);
      for (const later of openDialogs.slice(index + 1)) {
        if (dialog.contains(later.previousFocus))
          later.previousFocus = entry.previousFocus;
      }
      openDialogs.splice(index, 1);
      updateBackground();
      if (openDialogs.length === 0) {
        if (previousOverflow.value) {
          document.body.style.setProperty(
            "overflow",
            previousOverflow.value,
            previousOverflow.priority,
          );
        } else document.body.style.removeProperty("overflow");
      }
      if (wasTopDialog) {
        const activeDialog = openDialogs.at(-1)?.dialog;
        const previous = entry.previousFocus;
        if (
          previous?.isConnected &&
          !previous.closest("[inert]") &&
          (!activeDialog || activeDialog.contains(previous))
        ) {
          previous.focus({ preventScroll: true });
        }
        if (activeDialog && !activeDialog.contains(document.activeElement))
          focusDialog(activeDialog);
      }
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        ref={dialogRef}
        tabIndex={-1}
        className={`image-modal ${variant}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={accessibleTitleId}
      >
        <div className="image-modal-header">
          <div>
            <strong id={accessibleTitleId}>{title}</strong>
            {subtitle ? <span>{subtitle}</span> : null}
          </div>
          <button type="button" onClick={onClose} aria-label={closeLabel}>
            <X size={18} />
          </button>
        </div>
        <div className={bodyClassName}>{children}</div>
        {actions ? <div className="image-modal-actions">{actions}</div> : null}
      </section>
    </div>
  );
}
