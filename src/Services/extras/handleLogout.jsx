import Swal from "sweetalert2";
import { LOGOUT_API } from "../Auth";
import { LOGOUT_REDUX } from "../../store/authSlice";
import store from "../../store/store";

export const handleLogout = async (type = "normal") => {
    if (type == "session") {
        finalLogout()
        return
    }


    Swal.fire({
        title: "Are you sure?",
        text: "You want to Sign Out?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "rgba(15, 104, 208, 1)",
        cancelButtonColor: "rgba(217, 32, 40, 1)",
        confirmButtonText: "Yes, Sign Out!",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
    }).then(async (result) => {
        if (result.isConfirmed) {
            LogoutLoader()

        }
    });
};

export const finalLogout = async () => {
    try {
        LOGOUT_API(store.getState().auth.employee_id);
    } catch (error) {
        console.error("Error:", error);
    }
    store.dispatch(LOGOUT_REDUX());
    // navigate("/");
    // window.location.href = "/";
}



const LogoutLoader = () => {
    Swal.fire({
        title: "Signing Out",
        text: "You need to Sign In again.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
        timer: 1000,
    }).then(() => {
        Swal.close()
        finalLogout()
    })
};