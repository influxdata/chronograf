import React, {SFC} from 'react'

interface Props {
    modelName: string
    onEdit: (e: any) => void
    isEditing: boolean
}

const NameSection: SFC<Props> = ({
    modelName,
    onEdit,
    isEditing,
}) => {
    if (!isEditing) {
        return (
            <h3>{modelName}</h3>
        )
    }    

    return (
        <input
            type="text"
            name="name"
            className="form-control input-md form-malachite"
            onChange={onEdit}
            value={modelName}
            placeholder="ex: my-model"
        />
    )
}

export default NameSection
