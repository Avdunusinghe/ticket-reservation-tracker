using TRT.Application.DTOs.Common;

namespace TRT.Application.DTOs.TrainDTOs
{
    public class TrainMasterDataDTO
    {
        public TrainMasterDataDTO()
        {
            Status = new List<DropDownDTO>();
            AvailableDays = new List<DropDownDTO>();
            PassengerClasses = new List<DropDownDTO>();
        }
        public List<DropDownDTO> Status { get; set; }
        public List<DropDownDTO> AvailableDays { get; set; }
        public List<DropDownDTO> PassengerClasses { get; set; }

    }
}
