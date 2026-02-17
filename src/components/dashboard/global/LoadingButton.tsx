import { Spinner } from '@/components/ui/spinner';
import {FC} from  'react'

interface LoadingButtonProps {
 
}

const LoadingButton: FC<LoadingButtonProps> = ({}) => {
 return (
   <div className="flex items-center gap-2">
     <Spinner></Spinner> Cooking{" "}
   </div>
 );
}

export default LoadingButton