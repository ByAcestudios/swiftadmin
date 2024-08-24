import { Button } from "@/components/ui/button";

const OrderActions = ({ onAccept, onReject }) => {
  return (
    <div className="flex justify-end space-x-3 mt-6">
      <Button onClick={onAccept} className="bg-green-500 hover:bg-green-600 text-white">
        Accept Order
      </Button>
      <Button onClick={onReject} className="bg-red-500 hover:bg-red-600 text-white">
        Reject Order
      </Button>
    </div>
  );
};

export default OrderActions;
