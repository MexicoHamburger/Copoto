import postlist from '../temp/itemsFromDB.json'
import PagePreview from './PagePreview.js'
import { useNavigate, useParams } from "react-router";

function PostList() {
    const params = useParams();
    const dashboard = params.dashboard;
    const navigate = useNavigate();

    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="font-bold text-2xl pt-4 pb-4">
                    전체 게시글 보기
                </div>

                {dashboard ? <button
                    className="w-auto p-2 h-auto bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-600"
                    onClick={() => { navigate(`/createpost?boardType=${dashboard}`) }}
                >
                    게시글 작성
                </button> : <></>}
            </div>
            <div className="pr-[0%]">
                {postlist.filter((page) => !dashboard || page.type === dashboard).length > 0 ? (
                    postlist
                        .filter((page) => !dashboard || page.type === dashboard)
                        .map((page) => <PagePreview key={page.id} page={page} />)
                ) : (
                    <p>해당 유형의 게시글이 없습니다.</p>
                )}
            </div>
        </div>
    );
}

export default PostList;