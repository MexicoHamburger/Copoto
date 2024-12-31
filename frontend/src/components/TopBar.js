import CopotoLogo from "../images/copotoLogo.png"

function TopBar() {
    return (
        <div className = "border-b">
            <div className = "pl-[10%]">
                <img src={CopotoLogo} alt = "Copoto Logo"
                className = "max-w-[200px] p-4"/>
            </div>
        </div>
    )
}

export default TopBar;