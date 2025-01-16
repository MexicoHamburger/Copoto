// import { useSearchParams } from "react-router";

function CreatePostPage() {
    // const [searchParams] = useSearchParams();
    // const boardType = searchParams.get("boardType"); // 쿼리에서 데이터 읽기

    const handlePost = () => {
        
    }

    return (
        <div className="pt-[30px]">
            <h1 className="text-3xl">게시글 작성</h1>

            <form onSubmit={handlePost}>
                <input type="text" placeholder="제목을 입력해주세요." className="w-full h-10 border border-gray-300 rounded-lg mt-5 p-3" />
                <textarea type="text" placeholder="내용을 입력해주세요." className="w-full h-[300px] border border-gray-300 text-left align-top rounded-lg mt-3 p-3" />
                <div className="flex">
                    <button
                        //구현필요
                        onClick={() => { }}
                        className="mt-5 mr-5 p-2 pl-4 pr-4 h-1/2 bg-gray-200 text-blue-500 text-xs font-bold rounded-lg hover:bg-gray-300"
                    >
                        게시글 임시저장 (미구현)
                    </button>
                    <button
                        //구현필요
                        onClick={() => { }}
                        className="mt-5 p-2 pl-4 pr-4 h-1/2 bg-gray-200 text-blue-500 text-xs font-bold rounded-lg hover:bg-gray-300"
                    >
                        임시저장 게시글 불러오기 (미구현)
                    </button>
                    <button
                        type="submit"
                        className="mt-5 ml-auto p-2 pl-4 pr-4 h-1/2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600"
                    >
                        게시글 작성
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreatePostPage;