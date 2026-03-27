import { GET_MY_DETAILS_API } from "../../Services/Auth";
import { UPDATE_MY_DETAILS_REDUX } from "../../store/authSlice";
import store from "../../store/store";

export const updateMyDetailsInRedux = async () => {
  const dispatch =  store.dispatch
  if(!store.getState().auth.isAuthenticated) return
  try {

    const response = await GET_MY_DETAILS_API();
    let data = response?.data;
    console.log("🚀 ~ updateMyDetailsInRedux ~ data:", data);
    if (data?.status === 200) {
      dispatch(UPDATE_MY_DETAILS_REDUX(data?.payload?.userDetails));
    } else {
   

    }
  } catch (error) {
   
  }
};