import pagelist from '../temp/itemsFromDB.json'
import PagePreview from './PagePreview.js'

function PageList() {
    
    return (
        <div className = "pt-[75px] pl-[10%] pr-[10%]">
            <div className = "font-bold text-2xl pt-4 pb-4">
                전체 게시글 보기
            </div>
            <div className = "pr-[50%]">
                {pagelist.map((page) => (
                    <PagePreview key={page.id} page={page} />
                ))}
            </div>
        </div>
    );
}

export default PageList;