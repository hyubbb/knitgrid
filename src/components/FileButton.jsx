/**
 * 숨김 file input을 감싼 라벨 버튼. .file-button 스타일을 사용.
 * @param {object} props
 * @param {React.ComponentType<{size?:number}>} [props.icon]
 * @param {number} [props.iconSize=16]
 * @param {string} [props.accept]
 * @param {(files: FileList) => void} props.onFiles
 * @param {string} [props.title]
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.children]
 */
export function FileButton({ icon: Icon, iconSize = 16, accept, onFiles, title, className = '', children }) {
  return (
    <label className={`file-button ${className}`.trim()} title={title}>
      {Icon ? <Icon size={iconSize} /> : null}
      {children}
      <input
        type="file"
        accept={accept}
        onChange={(event) => {
          if (event.target.files?.length) onFiles(event.target.files);
        }}
      />
    </label>
  );
}
