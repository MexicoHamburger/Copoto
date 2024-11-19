import CopotoLogo from "../images/copotoLogo.png"

function TopBar() {
    return (
        <div className = "border-2">
            <img src={CopotoLogo} alt = "Copoto Logo"
            className = "max-w-[200px] p-4"/>
        </div>
    )
}

export default TopBar;