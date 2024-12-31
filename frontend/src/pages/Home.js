import TopBar from "../components/TopBar.js"
import SampleSidebar from "../components/SampleSidebar.js"

function Home() {
    return (
        <>
            <TopBar />
            <div className = "pl-[10%]">
                <SampleSidebar />
            </div>
        </>
    );
}

export default Home;