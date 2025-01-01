function PagePreview({ page }) {
    
    return (
        <div className="border p-4 max-h-[150px]">
            <h1 className = "font-bold text-xl pb-2">{page.title}</h1>
            {/* 기본 3줄만 ellipsis 없이이 로딩하기 위해 max-h를 72px, overflow-hidden으로 제한 */}
            <p className = "text-gray-500 max-h-[72px] overflow-hidden">{page.content}</p>
        </div>
    );
}

export default PagePreview;