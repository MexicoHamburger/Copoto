import { useSearchParams } from "react-router";

function CreatePostPage() {
    const [searchParams] = useSearchParams();
    const boardType = searchParams.get("boardType"); // 쿼리에서 데이터 읽기
    return (
        <div className="pt-[30px]">
            <h1 className = "text-3xl">게시글 작성</h1>
            <input type="text" placeholder="제목을 입력해주세요." className="w-full h-10 border border-gray-300 rounded-lg mt-5 p-3" />
            <textarea type="text" placeholder="내용을 입력해주세요." className="w-full h-[300px] border border-gray-300 text-left align-top rounded-lg mt-3 p-3" />

        </div>
    );
}

export default CreatePostPage;